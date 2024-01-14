(() => {
    let debounceTimer;

    const sendEmailText = (emailText) => {
        addLoadingIndicator();
        chrome.storage.local.set({ emailBody: emailText }, () => {
            chrome.runtime.sendMessage({ type: "PHISHING_DETECTION_GPT"});
        });
    };

    const observeIframeContent = (iframe) => {
        const iframeObserverCallback = () => {
            const emailText = iframe.contentDocument.body.innerText;

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => sendEmailText(emailText), 500); // Adjust the delay as needed
        };

        const iframeObserver = new MutationObserver(iframeObserverCallback);
        iframeObserver.observe(iframe.contentDocument.body, { childList: true, subtree: true });
    };

    const mainObserverCallback = (mutationsList, observer) => {
        const iframe = document.getElementById("zv__TV-main__MSG__body__iframe");
        if (iframe) {
            observeIframeContent(iframe);
        }
    };

    const mainObserver = new MutationObserver(mainObserverCallback);
    mainObserver.observe(document.body, { childList: true, subtree: true });
})();

function updateGptAnalysisIndicator(isPhishing) {
    const loadingDiv = document.getElementById("loadingIndicator");
    if (!loadingDiv) return;

    // Clear existing content
    loadingDiv.innerHTML = '';

    // Set the text and color based on the GPT analysis result
    if (isPhishing) {
        loadingDiv.textContent = "Phishing Email";
        loadingDiv.style.backgroundColor = "#ff595e";
    } else {
        loadingDiv.textContent = "Safe Email";
        loadingDiv.style.backgroundColor = "#80b918";
    }
    loadingDiv.style.cursor = "pointer";
    loadingDiv.addEventListener('click', () => {
        // Open the popup page of the extension
        chrome.runtime.sendMessage({ type: "OPEN_INFO_PAGE" });
    });
}

function addLoadingIndicator() {
    const emailDiv = document.getElementById("zv__TV-main__MSG");
    if (!emailDiv) return;

    // Create a new div element for the loading indicator
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "loadingIndicator";
    loadingDiv.style.cssText = "box-shadow: rgba(0, 0, 0, 0.16);border-radius: 7px;display: flex;justify-content: center;min-width: 50px;position: inherit;width: 100px;margin-left: 100px;top: 0px;right: 0px;padding: 5px;color: black;font-weight: bold;background-color: #4287f5;cursor: pointer;margin-inline: 200px;";

    // Add "Detecting" text
    const detectingText = document.createElement("span");
    detectingText.textContent = "Detecting";
    loadingDiv.appendChild(detectingText);

    // Add spinner
    const spinner = document.createElement("div");
    spinner.style.cssText = "display: inline-block; margin-left: 5px; border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; width: 12px; height: 12px; animation: spin 2s linear infinite;";
    loadingDiv.appendChild(spinner);

    // Append the loading indicator to the email div
    emailDiv.appendChild(loadingDiv);
}

// Add CSS for spinner animation
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = "@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
document.head.appendChild(styleSheet);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GPT_RESPONSE") {
        chrome.storage.local.get("gptResult", (data) => {
            console.log("Response : " + data.gptResult);
            if (data.gptResult === "Phishing Email") {
                updateGptAnalysisIndicator(true);
            }
            else 
            {
                updateGptAnalysisIndicator(false);
            }
        });
        
    }
    return true;
});
