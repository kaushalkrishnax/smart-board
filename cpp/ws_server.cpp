#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio.hpp>
#include <iostream>
#include <fstream>
#include <memory>
#include <string>
#include <vector>
#include <mutex>
#include <nlohmann/json.hpp>

using tcp = boost::asio::ip::tcp;
namespace websocket = boost::beast::websocket;
using json = nlohmann::json;

std::mutex lock;
std::vector<std::shared_ptr<websocket::stream<tcp::socket>>> clients;
json switches;

// load switches.json
void loadSwitches()
{
    std::ifstream f("switches.json");
    if (f)
    {
        f >> switches;
        std::cout << "Loaded switches.json\n";
    }
    else
    {
        switches = {
            {"switches", json::array({{{"id", 1}, {"state", "OFF"}},
                                      {{"id", 2}, {"state", "OFF"}}})}};
        std::ofstream o("switches.json");
        o << switches.dump(4);
        std::cout << "Created default switches.json\n";
    }
}

// save switches.json
void saveSwitches()
{
    std::ofstream o("switches.json");
    o << switches.dump(4);
}

// broadcast full state to all clients
void broadcastSwitchState()
{
    json packet = {
        {"type", "switches"},
        {"switches", switches["switches"]}};

    std::lock_guard<std::mutex> guard(lock);
    for (auto &client : clients)
    {
        try
        {
            client->text(true);
            client->write(boost::asio::buffer(packet.dump()));
        }
        catch (...)
        {
        }
    }
}

// per-client session
void session(std::shared_ptr<websocket::stream<tcp::socket>> ws)
{
    {
        std::lock_guard<std::mutex> guard(lock);
        clients.push_back(ws);
    }

    ws->accept();

    // send initial state
    broadcastSwitchState();

    for (;;)
    {
        boost::beast::flat_buffer buffer;

        try
        {
            ws->read(buffer);
        }
        catch (...)
        {
            std::cerr << "Client disconnected\n";
            return;
        }

        std::string msg = boost::beast::buffers_to_string(buffer.data());

        json data;
        try
        {
            data = json::parse(msg);
        }
        catch (...)
        {
            std::cerr << "Invalid JSON received\n";
            continue;
        }

        if (!data.contains("type"))
            continue;
        std::string type = data["type"];

        // only used for handshake/identification
        if (type == "auth")
        {
            std::cout << "Auth token received: " << data.value("token", "NO TOKEN") << "\n";
        }

        // single toggle from frontend / ESP
        else if (type == "toggle")
        {
            int id = data.value("id", -1);
            std::string newState = data.value("state", "");

            for (auto &sw : switches["switches"])
            {
                if (sw["id"] == id)
                {
                    sw["state"] = newState;
                    break;
                }
            }

            saveSwitches();
            broadcastSwitchState();
        }

        // all ON or all OFF
        else if (type == "all")
        {
            std::string value = data.value("state", "OFF");

            for (auto &sw : switches["switches"])
            {
                sw["state"] = value;
            }

            saveSwitches();
            broadcastSwitchState();
        }

        else if (type == "switches" && data.contains("switches"))
        {
            switches["switches"] = data["switches"];
            saveSwitches();
            broadcastSwitchState();
        }
    }
}

int main()
{
    try
    {
        loadSwitches();

        boost::asio::io_context ioc;
        tcp::acceptor acceptor(ioc, tcp::endpoint(tcp::v4(), 8080));

        std::cout << "WebSocket server running on ws://localhost:8080\n";

        for (;;)
        {
            auto socket = acceptor.accept();
            auto ws = std::make_shared<websocket::stream<tcp::socket>>(std::move(socket));
            std::thread(session, ws).detach();
        }
    }
    catch (std::exception const &e)
    {
        std::cerr << "Fatal Error: " << e.what() << "\n";
    }
}
