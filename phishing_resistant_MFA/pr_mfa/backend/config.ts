import EmailPassword from "supertokens-node/recipe/emailpassword";
import Session from "supertokens-node/recipe/session";
import { TypeInput } from "supertokens-node/types";
import Dashboard from "supertokens-node/recipe/dashboard";
import UserRoles from "supertokens-node/recipe/userroles";

import WebAuthn from "supertokens-node/recipe/webauthn"; // Add this import

import AccountLinking from "supertokens-node/recipe/accountlinking";
import MultiFactorAuth from "supertokens-node/recipe/multifactorauth";
import TOTP from "supertokens-node/recipe/totp";
import Passwordless from "supertokens-node/recipe/passwordless";

export function getApiDomain() {
    const apiPort = process.env.VITE_APP_API_PORT || 3001;
    const apiUrl = process.env.VITE_APP_API_URL || `http://localhost:${apiPort}`;
    return apiUrl;
}

export function getWebsiteDomain() {
    const websitePort = process.env.VITE_APP_WEBSITE_PORT || 3000;
    const websiteUrl = process.env.VITE_APP_WEBSITE_URL || `http://localhost:${websitePort}`;
    return websiteUrl;
}

export const SuperTokensConfig: TypeInput = {
    framework: "koa",
    supertokens: {
        // this is the location of the SuperTokens core.
        connectionURI: "https://try.supertokens.com",
    },
    appInfo: {
        // learn more about this on https://supertokens.com/docs/thirdpartyemailpassword/appinfo
        appName: "SuperTokens Koa demo app",
        apiDomain: getApiDomain(),
        websiteDomain: getWebsiteDomain(),
    },
    recipeList: [
        EmailPassword.init(),
        WebAuthn.init(), // Add WebAuthn recipe
        Passwordless.init({
            contactMethod: "EMAIL_OR_PHONE",
            flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
        }),
        AccountLinking.init({
            shouldDoAutomaticAccountLinking: async (newAccountInfo: AccountInfoWithRecipeId & { recipeUserId?: RecipeUserId }, user: User | undefined, session: SessionContainerInterface | undefined, tenantId: string, userContext: UserContext) => {
                if (session === undefined) {
                    // we do not want to do first factor account linking by default. To enable that,
                    // please see the automatic account linking docs in the recipe docs for your first factor.
                    return {
                        shouldAutomaticallyLink: false
                    };
                }
                if (user === undefined || session.getUserId() === user.id) {
                    // if it comes here, it means that a session exists, and we are trying to link the 
                    // newAccountInfo to the session user, which means it's an MFA flow, so we enable 
                    // linking here.
                    return {
                        shouldAutomaticallyLink: true,
                        shouldRequireVerification: false
                    }
                }
                return {
                    shouldAutomaticallyLink: false
                };
            }
        }),
        MultiFactorAuth.init({
            firstFactors: ["webauthn", "emailpassword"],
            override: {
                functions: (oI) => ({
                    ...oI,
                    getMFARequirementsForAuth: () => [
                        {
                            oneOf: [
                                MultiFactorAuth.FactorIds.TOTP,
                                //MultiFactorAuth.FactorIds.EMAILPASSWORD,
                                MultiFactorAuth.FactorIds.OTP_EMAIL,
                                MultiFactorAuth.FactorIds.OTP_PHONE,
                            ],
                        },
                    ],
                }),
            },
        }),
        TOTP.init(),
        Session.init(), 
        Dashboard.init(), 
        UserRoles.init()
    ],
};
