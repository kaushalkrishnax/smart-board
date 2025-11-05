{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_latest
    pkgs.bun
  ];
}