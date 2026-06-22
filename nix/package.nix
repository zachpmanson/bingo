{ pkgs ? import <nixpkgs> {} }:

let
  pnpmDeps = pkgs.fetchPnpmDeps {
    pname = "bingo";
    version = "0.0.0";
    src = ../.;
    fetcherVersion = 3;
    hash = lib.fakeHash;
  };
in

pkgs.stdenv.mkDerivation {
  pname = "bingo";
  version = "0.0.0";
  src = ../.;

  nativeBuildInputs = [ pkgs.nodejs_24 pkgs.pnpm pkgs.pnpmConfigHook ];

  inherit pnpmDeps;

  buildPhase = ''
    runHook preBuild
    pnpm build
    runHook postBuild
  '';

  # Nitro node-server output; run with: node $out/server/index.mjs
  installPhase = ''
    runHook preInstall
    mkdir -p $out
    cp -r .output/. $out/
    runHook postInstall
  '';
}
