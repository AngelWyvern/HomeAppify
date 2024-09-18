#!/bin/sh

mkdir -p cert
cd cert

openssl genrsa -out homeappify.key 2048
openssl req -new -key homeappify.key -out homeappify.csr -config ../certconfig.cnf
openssl x509 -req -in homeappify.csr -signkey homeappify.key -out homeappify.crt
rm homeappify.csr