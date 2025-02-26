const { google } = require("googleapis");
const fs = require("fs");
const readline = require("readline");
const path = require("path");

const KEY_FILE_PATH = 'Quickstart-3330b5de2e63.json';
const TOKEN_PATH = path.join(__dirname, "token.js");

let ga4Auth = null;
let adsenseAuth = null;


function getGA4Auth(){
    if(!ga4Auth) {
        ga4Auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE_PATH,
            scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
        });
    }

    return ga4Auth;
}

// try Authenticate Adsense 

async function getAdSenseAuth() {

    if (adsenseAuth) return adsenseAuth; // if already exists

    const credentialsPath = path.join(__dirname, "client_secret_774229601612-ps9nd7am93nrr4f6m4714jhlbvjn6emt.apps.googleusercontent.com.json");
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
    console.log('credentials: ', credentials);
    const { client_secret, client_id, redirect_uris } = credentials.web;

    const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
        auth.setCredentials(token);
    } else {
        const authUrl = auth.generateAuthUrl({
            access_type: "offline",
            scope: ["https://www.googleapis.com/auth/adsense.readonly"],
            prompt: "consent", // Forces Google to always return a refresh token
        });

        console.log("Authorize this app by visiting this URL:", authUrl);


        const readline = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        // readline.question("Enter the authorization code: ", async (code) => {
        //     const { tokens } = await auth.getToken(code);
        //     auth.setCredentials(tokens);
        //     fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        //     console.log("Token saved to token.json");
        //     readline.close();
        // });

        // return auth;

        return new Promise((resolve) => {
            readline.question("Enter the authorization code: ", async (code) => {
                readline.close();
                const { tokens } = await auth.getToken(code);
                auth.setCredentials(tokens);
    
                // Save token for future use
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 4));
                console.log("Token saved to", TOKEN_PATH);
    
                resolve(auth);
            });
        });
    }

    getAdSenseAuth().then(() => console.log("Authentication successful!"))
    .catch(error => console.error("Authentication failed:", error.message));
    // return auth;
}

module.exports = { getGA4Auth, getAdSenseAuth };
