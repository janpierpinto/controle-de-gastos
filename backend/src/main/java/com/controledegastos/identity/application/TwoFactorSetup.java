package com.controledegastos.identity.application;

public record TwoFactorSetup(String secret, String qrCodeBase64) {
}
