document.addEventListener('DOMContentLoaded', function() {
    const emailStatus = document.getElementById('emailStatus');
    const loadingDiv = document.getElementById('loading');
    const explanationResult = document.getElementById('explanationResult');
    const content = document.getElementById('content');
    const body = document.body;



    chrome.runtime.sendMessage({ type: "GET_GPT_CONTEXTUALIZATION" });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "GPT_CONTEXTUALIZATION_RESPONSE") {
            chrome.storage.local.get("gptContxtResult", (data) => {
                console.log("Response from contxt : " + data.gptContxtResult);
                loadingDiv.classList.add('hidden');
                explanationResult.textContent = data.gptContxtResult || 'No explanation available';
                content.classList.remove('hidden');
            });
            
        }
        // Retrieve and display the email status
        chrome.storage.local.get("gptResult", (data) => {
            const statusText = data.gptResult || 'Unknown';
            emailStatus.textContent = statusText;
    
            // Apply background color based on status
            if (statusText === 'Safe Email') {
                body.classList.add('safe');
            } else {
                body.classList.add('danger');
            }
        });
        return true;
    });

});
