#!/usr/bin/env sh
npm install
sqlite3 godzinowki.sqlite3 < godzinowki.sqlite3.sql

for file in test/*data; do
    sqlite3 godzinowki.sqlite3 < "$file"
done
