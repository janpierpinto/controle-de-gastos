package com.controledegastos.identity.web.dto;

import com.controledegastos.identity.application.TwoFactorSetup;

public record TwoFactorSetupResponse(String secret, String qrCodeDataUri) {

    public static TwoFactorSetupResponse from(TwoFactorSetup setup) {
        return new TwoFactorSetupResponse(setup.secret(), "data:image/png;base64," + setup.qrCodeBase64());
    }
}
