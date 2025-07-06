from supertokens_python import init, InputAppInfo, SupertokensConfig
from supertokens_python.recipe import session
from supertokens_python.recipe import dashboard
from supertokens_python.recipe import userroles
from supertokens_python.recipe import thirdparty
from supertokens_python.recipe.thirdparty.provider import ProviderInput, ProviderConfig, ProviderClientConfig



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
    app_name="SuperTokens Demo App",
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
                        third_party_id="google",
                        clients=[
                            ProviderClientConfig(
                                client_id="1060725074195-kmeum4crr01uirfl2op9kd5acmi9jutn.apps.googleusercontent.com",
                                client_secret="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"
                            )
                        ]
                    )
                ),
                ProviderInput(
                    config=ProviderConfig(
                        third_party_id="github",
                        clients=[
                            ProviderClientConfig(
                                client_id="467101b197249757c71f",
                                client_secret="e97051221f4b6426e8fe8d51486396703012f5bd"
                            )
                        ]
                    )
                ),
                ProviderInput(
                    config=ProviderConfig(
                        third_party_id="apple",
                        clients=[
                            ProviderClientConfig(
                                client_id="4398792-io.supertokens.example.service",
                                client_secret="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",
                                additional_config={
                                    "keyId": "7M48Y4RYDL",
                                    "privateKey": "-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgu8gXs+XYkqXD6Ala9Sf/iJXzhbwcoG5dMh1OonpdJUmgCgYIKoZIzj0DAQehRANCAASfrvlFbFCYqn3I2zeknYXLwtH30JuOKestDbSfZYxZNMqhF/OzdZFTV0zc5u5s3eN+oCWbnvl0hM+9IW0UlkdA\n-----END PRIVATE KEY-----",
                                    "teamId": "YWQCXGJRJL"
}
                            )
                        ]
                    )
                ),
                ProviderInput(
                    config=ProviderConfig(
                        third_party_id="twitter",
                        clients=[
                            ProviderClientConfig(
                                client_id="4398792-WXpqVXRiazdRMGNJdEZIa3RVQXc6MTpjaQ",
                                client_secret="BivMbtwmcygbRLNQ0zk45yxvW246tnYnTFFq-LH39NwZMxFpdC"
                            )
                        ]
                    )
                )
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