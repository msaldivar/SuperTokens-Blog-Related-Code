## Implementing SSO with SuperTokens

SuperTokens takes a developer first approach to SSO implementation, turning what's traditionally a complex integration into a straightforward process. Unlike heavyweight enterprise solutions, SuperTokens provides flexible, open-source authentication that scales from startup MVPs to enterprise deployments.

SuperTokens Core serves as the main authentication service handling all the auth logic, it can be self-hosted or use SuperTokens service. The backend sdk integrates with your APIs exposing the auth endpoints, and the frontend sdk manages the auth UI and session handling on the client side.

### Backend Details

The `connection_uri` is the link between your backend and the SuperTokens Core service. For dev environments you can make use of the demo instance:

`connection_uri="https://try.supertokens.com"`

In production, this should your self-hosted instance or the managed service endpoint. 

For a Python/FastAPI implementation, the complete configuration structure requires both connection details and app information: 

```python
# config.py
supertokens_config = SupertokensConfig(
    connection_uri="https://try.supertokens.com"
)

app_info = InputAppInfo(
    app_name="SuperTokens Proof of Concept",
    api_domain=get_api_domain(),
    website_domain=get_website_domain(),
    api_base_path="/auth",
    website_base_path="/auth"
)

```

In the same file you can add SuperTokens recipes, these recipes provide expanded pre-built auth features. Let's use the [Socal Login](https://supertokens.com/docs/authentication/social/introduction) Recipe to add Github SSO as a login method. 



```python
# config.py
from supertokens_python import InputAppInfo, SupertokensConfig, init
from supertokens_python.recipe import dashboard, session, thirdparty, userroles
from supertokens_python.recipe.thirdparty.provider import (
    ProviderClientConfig,
    ProviderConfig,
    ProviderInput,
)


def get_api_domain() -> str:
    api_port = str(3001)
    api_url = f"http://localhost:{api_port}"
    return api_url

def get_website_domain() -> str:
    website_port = str(3000)
    website_url = f"http://localhost:{website_port}"
    return website_url

supertokens_config = SupertokensConfig(
    connection_uri="https://try.supertokens.com"
)

app_info = InputAppInfo(
    app_name="SuperTokens Proof of Concept",
    api_domain=get_api_domain(),
    website_domain=get_website_domain(),
    api_base_path="/auth",
    website_base_path="/auth"
)

recipe_list = [
    session.init(),
    dashboard.init(),
    userroles.init(),
    thirdparty.init(
        sign_in_and_up_feature=thirdparty.SignInAndUpFeature(
            providers=[
                ProviderInput(
                    config=ProviderConfig(
                        third_party_id="github",
                        clients=[
                            ProviderClientConfig(
                                client_id="YOUR_CLIENT_ID_FROM_GITHUB",
                                client_secret="YOUR_CLIENT_SECRET_FROM_GITHUB"
                            )
                        ]
                    )
                ),
                ]
        )
    )
]

init(
    supertokens_config=supertokens_config,
    app_info=app_info,
    framework="fastapi",
    recipe_list=recipe_list,
    mode="asgi",
    telemetry=False
)

```

The `get_api_domain()`, and `get_website_domain()` must match your deployment urls to prevent cors issues, while the base paths define where SuperTokens routes are mounted. 

### Frontend Details
SuperTokens provides pre-built UI componets and an intereface for custom UIs, more information can be found in the [docs](https://supertokens.com/docs/quickstart/frontend-setup).

Using the `supertokens-web-js` sdk we'll add auth functionality to our angular frontend. 

Note the providers, we currently only specifiy github but SuperTokens has support for several others e.g Apple, Google, Discord. Check docs for a complete list of growing providers. 

```javascript
// config.ts
import SuperTokens from "supertokens-web-js";
import Session from "supertokens-web-js/recipe/session";

const isMultitenancy = false;

export function getApiDomain() {
    const apiPort = 3001;
    const apiUrl = `http://localhost:${apiPort}`;
    return apiUrl;
}

export function getWebsiteDomain() {
    const websitePort = 3000;
    const websiteUrl = `http://localhost:${websitePort}`;
    return websiteUrl;
}

export function initSuperTokensUI() {
    (window as any).supertokensUIInit("supertokensui", {
        appInfo: {
            websiteDomain: getWebsiteDomain(),
            apiDomain: getApiDomain(),
            appName: "SuperTokens Proof of Concept",
            websiteBasePath: "/auth",
            apiBasePath: "/auth",
        },
        
        recipeList: [
            (window as any).supertokensUISession.init(),
            (window as any).supertokensUIThirdParty.init({
                signInAndUpFeature: {
                    providers: [
                        (window as any).supertokensUIThirdParty.Github.init(),
                    ],
                },
            })
        ],
        getRedirectionURL: async (context: any) => {
            if (context.action === "SUCCESS") {
                return "/dashboard";
            }
            return undefined;
        },
    });
}

export function initSuperTokensWebJS() {
    SuperTokens.init({
        appInfo: {
            appName: "SuperTokens Proof of Concept",
            apiDomain: getApiDomain(),
            apiBasePath: "/auth",
        },
        recipeList: [
            Session.init()
        ]
    });

    if (isMultitenancy) {
        initTenantSelectorInterface();
    }
}

export async function initTenantSelectorInterface() { /* STUB, to prevent linters complaining */ };;
```

Lastly we need to update the FastAPI middleware file `app.py` to ensure proper request interception. 

```python
# app.py
import uvicorn

from fastapi import FastAPI, Depends
from starlette.middleware.cors import CORSMiddleware

from supertokens_python import init, get_all_cors_headers
from supertokens_python.framework.fastapi import get_middleware
from supertokens_python.recipe.session import SessionContainer
from supertokens_python.recipe.session.framework.fastapi import verify_session
from supertokens_python.recipe.multitenancy.asyncio import list_all_tenants

import config

# SuperTokens init should happen in config.py
app = FastAPI(
    title="SuperTokens Proof of Concept",
    # Disable automatic trailing slash redirection
    redirect_slashes=False
)
app.add_middleware(get_middleware())

async def get_session_info(s: SessionContainer = Depends(verify_session())):
    return {
        "sessionHandle": s.get_handle(),
        "userId": s.get_user_id(),
        "accessTokenPayload": s.get_access_token_payload(),
    }

# Add routes for both with and without trailing slash
app.get("/sessioninfo")(get_session_info)
app.get("/sessioninfo/")(get_session_info)
```
The `verify_session()` dependency automatically validates sessions and refreshes tokens when needed. For custom session validation logic, you can access the SessionContainer object which provides methods to read and modify session data.

If you would like to see a full end-to-end solution you can run the following cmd to generate an example app 

```bash
npx create-supertokens-app --appname=sso-with-supertokens --recipe=thirdparty --frontend=angular --backend=python
```


### Why SuperTokens for SSO?

**Open Source Flexibility**: Self-host for free with complete control over your authentication infrastructure, or use their managed service for hassle-free maintenance. No vendor lock-in means you own your user data and can customize every aspect of the authentication flow. Unlike Auth0 or Okta where you're at the mercy of their feature roadmap, with SuperTokens you can literally fork the core and add that weird edge case your enterprise client demands.

**Modern Protocol Support**: SuperTokens handles OAuth 2.0, OpenID Connect, and even SAML through clever integrations. The framework abstracts away protocol complexity while maintaining compliance with industry standards. Need to support that ancient LDAP system? You can build a custom provider on top of SuperTokens' extensible architecture. The recipe system means you're not dragging along authentication methods you'll never use—just include what you need.

**Developer Experience**: Pre-built UI components get you running in minutes, while comprehensive SDKs for Node.js, Python, and Go provide the flexibility to build custom flows. The documentation actually makes sense—a rarity in the auth space. Error messages tell you what went wrong AND how to fix it. The three-tier architecture means your debugging stays in familiar territory: your own backend logs, not some opaque third-party service.

**Session Management That Just Works**: Automatic token refresh, CSRF protection, and secure cookie handling come built-in. You don't need a PhD in web security to implement auth correctly. The SDK handles the gnarly bits like token rotation and concurrent request handling that typically cause race conditions in homegrown solutions.

**Cost-Effective Scaling**: The self-hosted option remains free regardless of user count. Even the managed service pricing stays reasonable as you grow, avoiding the painful pricing tiers of traditional auth providers. That surprise bill when you hit 10,001 monthly active users? Not happening here. Your auth costs become predictable infrastructure costs, not per-user taxes.

**True Framework Agnostic**: While our examples use Angular and Python, SuperTokens genuinely works with any stack. React, Vue, Svelte on the frontend? Covered. Express, FastAPI, Rails, Laravel on the backend? All supported. The standardized API means switching frameworks doesn't mean rewriting your entire auth layer.


