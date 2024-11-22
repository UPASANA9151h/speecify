document.getElementById('convert-btn').addEventListener('click', () => {
    const file = document.getElementById('pdf-upload').files[0];
    const language = document.getElementById('language-select').value;

    if (file) {
        document.getElementById('info').style.display = 'none';
        document.getElementById('container').style.width = '80%';

        // Show the spinner and reset the progress bar
        document.getElementById('spinner').style.display = 'block';
        document.getElementById('download-link').style.display = 'none';
        document.getElementById('progress-container').style.display = 'block';
        updateProgress(0);

        const fileReader = new FileReader();
        fileReader.onload = function () {
            const typedarray = new Uint8Array(this.result);
            updateProgress(10);

            pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                const numPages = pdf.numPages;
                let pagesProcessed = 0;
                let textContent = "";

                const pagesPromises = [];
                for (let i = 1; i <= numPages; i++) {
                    pagesPromises.push(
                        extractPageText(pdf, i).then(pageText => {
                            textContent += pageText + " ";
                            pagesProcessed++;
                            updateProgress(10 + (30 * pagesProcessed / numPages));
                        })
                    );
                }

                Promise.all(pagesPromises).then(() => {
                    updateProgress(50);
                    convertTextToSpeech(textContent, language);
                }).catch(error => {
                    console.error('Error processing PDF:', error);
                    document.getElementById('status').innerText = "Error processing PDF.";
                });
            });
        };
        fileReader.readAsArrayBuffer(file);
    } else {
        alert("Please upload a PDF file first.");
    }
});

function extractPageText(pdf, pageNum) {
    return pdf.getPage(pageNum).then(page => {
        return page.getTextContent().then(textContent => {
            let text = "";
            textContent.items.forEach(item => {
                text += item.str + " ";
            });
            return text;
        });
    });
}

function convertTextToSpeech(textContent, language) {
    fetch('/convert', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'text': textContent,
            'language': language
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const downloadLink = document.getElementById('download-link');
        downloadLink.href = url;
        downloadLink.style.display = 'block';
        downloadLink.download = 'speech.mp3';
        downloadLink.innerText = 'Download MP3';
        updateProgress(100);
    })
    .catch(error => {
        console.error('Error converting text to speech:', error);
        document.getElementById('status').innerText = "Error converting text to speech.";
    });
}

function updateProgress(percentage) {
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = percentage + '%';
    progressBar.innerText = Math.floor(percentage) + '%';
}
