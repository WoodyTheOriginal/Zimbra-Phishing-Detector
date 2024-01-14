async function getGptOpinion(emailBody, contxt) {
    const preprompt = "You are an advanced email security system equipped with machine learning algorithms to identify and intercept phishing emails. Your primary goal is to analyze the content of the email and accurately determine if it exhibits characteristics commonly associated with phishing attempts. Consider various factors such as suspicious links, mismatched sender information, urgency or threats, requests for sensitive information, and unusual or unexpected attachments. Pay close attention to language cues that may indicate manipulation or coercion of the recipient. Your analysis should also take into account the email's formatting, including generic salutations, misspellings, and inconsistent branding. Utilize contextual information to assess the legitimacy of any requests made in the email. Your comprehensive evaluation will enable you to effectively flag potential phishing emails and protect users from compromising their personal information or systems. Your ouput must be in a JSON format with one key 'status' and the value is either 'Safe Email' or 'Phishing Email'."
    const prepromptContxt = "You are an advanced email security system equipped with machine learning algorithms to identify and intercept phishing emails. Your primary goal is to analyze the content of the email and accurately determine if it exhibits characteristics commonly associated with phishing attempts. Consider various factors such as suspicious links, mismatched sender information, urgency or threats, requests for sensitive information, and unusual or unexpected attachments. Pay close attention to language cues that may indicate manipulation or coercion of the recipient. Your analysis should also take into account the email's formatting, including generic salutations, misspellings, and inconsistent branding. Utilize contextual information to assess the legitimacy of any requests made in the email. Your comprehensive evaluation will enable you to effectively flag potential phishing emails and protect users from compromising their personal information or systems. You are given a JSON Object which contains an email body and a status about wether this is a phishing email or not. You now have to explain why this status is like that. Your answer must be in a JSON format with the key answer and the value being your actual answer."
    const apiKey = ""
    const openAIEndpoint = 'https://api.openai.com/v1/chat/completions';
    let requestBody;

    if (contxt) {
        console.log("ITS A CONTEXTUALIZATION !!");
        requestBody = {
            model: "gpt-3.5-turbo-1106",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: prepromptContxt },
                { role: "user", content: emailBody }
            ]
        };
    } else {
        console.log("ITS NOT A CONTEXTUALIZATION");
        requestBody = {
            model: "gpt-3.5-turbo-1106",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: preprompt },
                { role: "user", content: emailBody.replace(/'/g, "") }
            ]
        };
    }

    console.log("Requesting GPT opinion...");
    try {
        const response = await fetch(openAIEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const answer = JSON.parse(data.choices[0].message.content);
        if (contxt) {
            console.log("Answer from GPT : \n" + data.choices[0].message.content);

        } else {
            console.log("Answer from GPT : \n" + answer.status);
        }
        return data.choices[0].message.content;
    } catch (error) {
        console.error(error);

        if (error.message.includes('Failed to fetch')) {
            console.log("Sleeping for 10 seconds before retry");
            await new Promise(resolve => setTimeout(resolve, 10000));
            return getGptOpinion(emailBody);
        } else {
            console.error(error.message);
        }
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "PHISHING_DETECTION_GPT") {
        chrome.storage.local.get("emailBody", (data) => {
            if (data && data.emailBody) {
                getGptOpinion(data.emailBody, false)
                    .then(response => {
                        // Process the response here
                        chrome.storage.local.set( { gptResult : JSON.parse(response).status} );
                        chrome.tabs.sendMessage(sender.tab.id, { type: "GPT_RESPONSE"});
                    })
                    .catch(error => {
                        sendResponse({ error: error.message });
                    });
                return true; // Indicates asynchronous response
            }
        });
    }
    if (request.type === "OPEN_INFO_PAGE") {
        chrome.tabs.create({ url: chrome.runtime.getURL("info.html") });
        return true;
    }
    if (request.type === "GET_GPT_CONTEXTUALIZATION") {
        chrome.storage.local.get(["emailBody", "gptResult"], (data) => {
            // Perform the OpenAI API request here
            const gptContxtPrompt = '{"emailBody": '+ data.emailBody +', "status" : ' + data.gptResult + '}';
            console.log("Prompt pour contextualization : \n" + gptContxtPrompt);

            getGptOpinion(gptContxtPrompt, true).then(response => {
                chrome.storage.local.set( { gptContxtResult : JSON.parse(response).answer} );
                chrome.tabs.sendMessage(sender.tab.id, { type: "GPT_CONTEXTUALIZATION_RESPONSE"});
            }).catch(error => {
                sendResponse({ result: `Error: ${error.message}` });
            });
            return true; // Indicates asynchronous response
        });
    }
});
