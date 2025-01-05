import { createDataItemSigner, message, spawn, result } from "@permaweb/aoconnect";
import { GATEWAYS, PAGINATORS, CURSORS, assetTags, aaStandard } from "../utils";




function getQuery(args) {
    const paginator = args.paginator ? args.paginator : PAGINATORS.default;
    const ids = args.ids ? JSON.stringify(args.ids) : null;
    const tagFilters = args.tagFilters
        ? JSON.stringify(args.tagFilters)
            .replace(/"([^"]+)":/g, '$1:')
            .replace(/"FUZZY_OR"/g, 'FUZZY_OR')
        : null;
    const owners = args.owners ? JSON.stringify(args.owners) : null;
    const cursor = args.cursor && args.cursor !== CURSORS.end ? `"${args.cursor}"` : null;

    let fetchCount = `first: ${paginator}`;
    let txCount = '';
    let nodeFields = `data { size type } owner { address } block { height timestamp }`;
    let order = '';

    switch (args.gateway) {
        case GATEWAYS.arweave:
            break;
        case GATEWAYS.goldsky:
            txCount = `count`;
            break;
    }

    const query = {
        query: `
        query {
          transactions(
            ids: ${ids},
            tags: ${tagFilters},
            ${fetchCount}
            owners: ${owners},
            after: ${cursor},
            ${order}
          ) {
            ${txCount}
            pageInfo {
              hasNextPage
            }
            edges {
              cursor
              node {
                id
                tags {
                  name 
                  value 
                }
                ${nodeFields}
              }
            }
          }
        }
      `,
    };

    return JSON.stringify(query);
}

async function getGQLData(args) {
    const paginator = args.paginator ? args.paginator : PAGINATORS.default;

    let data = [];
    let count = 0;
    let nextCursor = null;

    if (args.ids && !args.ids.length) {
        return { data: data, count: count, nextCursor: nextCursor, previousCursor: null };
    }

    try {
        const response = await fetch(`https://${args.gateway}/graphql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: getQuery(args),
        });
        const responseJson = await response.json();
        if (responseJson.data.transactions.edges.length) {
            data = [...responseJson.data.transactions.edges];
            count = responseJson.data.transactions.count ?? 0;

            const lastResults = data.length < paginator || !responseJson.data.transactions.pageInfo.hasNextPage;

            if (lastResults) nextCursor = CURSORS.end;
            else nextCursor = data[data.length - 1].cursor;

            return {
                data: data,
                count: count,
                nextCursor: nextCursor,
                previousCursor: null,
            };
        } else {
            return { data: data, count: count, nextCursor: nextCursor, previousCursor: null };
        }
    } catch (e) {
        console.error(e);
        return { data: data, count: count, nextCursor: nextCursor, previousCursor: null };
    }
}


async function runGQLQuery(processId) {
    try {
        const gqlResponse = await getGQLData({
            gateway: GATEWAYS.goldsky,
            ids: [processId],
            tagFilters: null,
            owners: null,
            cursor: null,
            reduxCursor: null,
            cursorObjectKey: null,
        });

        // console.log('GraphQL Query Response:', JSON.stringify(gqlResponse, null, 2));
        return gqlResponse;

    } catch (error) {
        console.error('Error running GraphQL query:', error);
        return { data: [], count: 0, nextCursor: null, previousCursor: null };
    }
}

export async function aaSteps(walletAddress) {
    console.log("Start");
    const signer = createDataItemSigner(globalThis.arweaveWallet);

    try {
        // Step 1: Spawn the process
        const processId = await spawn({
            module: "bkjb55i07GUCUSWROtKK4HU1mBS_X0TyH3M5jMV6aPg",
            scheduler: "fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY",
            signer: signer,
            data: "JPEG_BUFFER",
            tags: assetTags(walletAddress),
        });

        console.log("Process spawned: ", processId);

        // Step 2: Poll for process status
        let processFound = false;
        let retryCount = 0;
        const maxRetries = 25;

        while (!processFound && retryCount < maxRetries) {
            console.log(`Checking process status (Attempt ${retryCount + 1}/${maxRetries})...`);
            const gqlResponse = await runGQLQuery(processId);

            if (gqlResponse.data.length > 0) {
                processFound = true;
                console.log("Process found in AO.");
            } else {
                retryCount++;
                console.log("Process not found. Retrying in 3 seconds...");
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        // If process not found after retries
        if (!processFound) {
            console.error("Max retries reached. Process not found in AO.");
            return null;
        }

        // Step 3: Execute the message (Evaluation)
        const evalMessage = await message({
            process: processId,
            signer: signer,
            tags: [{ name: 'Action', value: 'Eval' }],
            data: aaStandard(walletAddress),
        });

        console.log("Message Executed: ", evalMessage);

        // Step 4: Get the result of the evaluation
        const evalResult = await result({
            message: evalMessage,
            process: processId,
        });

        console.log("Eval Result:", evalResult);

        // Step 5: Add the asset to the profile
        const finalMessage = await message({
            process: processId,
            signer: signer,
            tags: [
                { name: 'Action', value: 'Add-Asset-To-Profile' },
                { name: 'ProfileProcess', value: walletAddress },
                { name: 'Quantity', value: "1" },
            ],
            data: JSON.stringify({ Id: processId, Quantity: "1" }),
        });

        console.log("Profile Added:", finalMessage);

        return processId;

    } catch (error) {
        console.error("Error in aaSteps: ", error.message);
        return null;
    }
}