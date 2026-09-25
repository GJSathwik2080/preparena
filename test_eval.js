(async () => {
    try {
        console.log("Sending request...");
        const res = await fetch('https://fxhotx9euc.execute-api.ap-south-1.amazonaws.com/speech/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: "hello this is a test",
                scenario: "none"
            })
        });
        const data = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", data);
    } catch(err) {
        console.error(err);
    }
})();
