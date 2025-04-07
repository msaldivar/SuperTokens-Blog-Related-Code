import Koa from "koa";
import cors from "@koa/cors";
import supertokens from "supertokens-node";
import { middleware } from "supertokens-node/framework/koa";
import { getWebsiteDomain, SuperTokensConfig } from "./config";
import KoaRouter from "koa-router";
import { verifySession } from "supertokens-node/recipe/session/framework/koa";
import { SessionContext } from "supertokens-node/framework/koa";
import Multitenancy from "supertokens-node/recipe/multitenancy";

import { deleteUser } from "supertokens-node";

interface AuthAttempt {
    time: string;
    userId: string;
    status: string;
}

const authLogs = {
    success: 0,
    failure: 0,
    recentAttempts: [] as AuthAttempt[]  // Explicitly type the array
};

supertokens.init(SuperTokensConfig);

const app = new Koa();

const router = new KoaRouter();

app.use(
    cors({
        origin: getWebsiteDomain(),
        allowHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
        credentials: true,
    })
);

// This exposes all the APIs from SuperTokens to the client.
app.use(middleware());

// This endpoint can be accessed regardless of
// having a session with SuperTokens
router.get("/hello", (ctx: SessionContext) => {
    ctx.body = "hello";
});

// An example API that requires session verification
router.get("/sessioninfo", verifySession(), (ctx: SessionContext) => {
    const userId = ctx.session!.getUserId();
    
    // Log successful authentication
    authLogs.success++;
    authLogs.recentAttempts.push({
        time: new Date().toISOString(),
        userId,
        status: "success"
    });
    
    // Keep only recent 20 entries
    if (authLogs.recentAttempts.length > 20) {
        authLogs.recentAttempts.shift();
    }
    
    ctx.status = 200;
    ctx.body = {
        userId,
        status: "ok",
        authStats: authLogs
    };
});

// This API is used by the frontend to create the tenants drop down when the app loads.
// Depending on your UX, you can remove this API.
router.get("/tenants", async (ctx: SessionContext) => {
    const tenants = await Multitenancy.listAllTenants();
    ctx.body = JSON.stringify({ tenants }, null, 4);
});

app.use(router.routes());

if (!module.parent) app.listen(3001, () => console.log("API Server listening on port 3001"));
