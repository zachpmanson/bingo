self: { config, lib, pkgs, ... }:

let
  cfg = config.services.bingo;
in {
  options.services.bingo = {
    enable = lib.mkEnableOption "bingo server";

    package = lib.mkOption {
      type = lib.types.package;
      default = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
      description = "The bingo package to use.";
    };

    port = lib.mkOption {
      type = lib.types.port;
      default = 3000;
      description = "Port the app listens on.";
    };

    hostname = lib.mkOption {
      type = lib.types.str;
      default = "127.0.0.1";
      description = "Hostname/interface the app binds to. Use \"0.0.0.0\" to accept external traffic.";
    };

    openFirewall = lib.mkOption {
      type = lib.types.bool;
      default = false;
      description = "Whether to open `port` in the firewall.";
    };
  };

  config = lib.mkIf cfg.enable {
    networking.firewall.allowedTCPPorts = lib.mkIf cfg.openFirewall [ cfg.port ];

    systemd.services.bingo = {
      description = "bingo server";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];

      environment = {
        PORT = toString cfg.port;
        HOST = cfg.hostname;
        NODE_ENV = "production";
        # SQLite file, persisted under /var/lib/bingo (see StateDirectory below)
        BOARDS_DB = "/var/lib/bingo/boards.sqlite";
      };

      serviceConfig = {
        ExecStart = "${pkgs.nodejs_24}/bin/node ${cfg.package}/server/index.mjs";
        DynamicUser = true;
        StateDirectory = "bingo";
        WorkingDirectory = "/var/lib/bingo";
        PrivateTmp = true;
        ProtectSystem = "strict";
        NoNewPrivileges = true;
        Restart = "on-failure";
        RestartSec = "5s";
      };
    };
  };
}
