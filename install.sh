#!/bin/bash

if (( $EUID == 0 )); then
	INSTALL_DIR="/usr/share/gnome-shell/extensions"
else
	INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions"
fi
mkdir -p $INSTALL_DIR

echo "Installing extension files in $INSTALL_DIR/kill_ports@stasrusnak.github.com"
cp -r kill_ports@stasrusnak.github.com $INSTALL_DIR

echo "Done."
exit 0
