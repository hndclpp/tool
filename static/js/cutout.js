const cutoutButton = document.getElementById('cutoutButton');
const imageUpload = document.getElementById('imageUpload');
const cutoutImage = document.getElementById('cutoutImage');

let apiKeyIndex = 0;

cutoutButton.addEventListener('click', async () => {
    const file = imageUpload.files[0];
    if (!file) {
        alert("Please upload an image first.");
        return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
        const response = await fetch('/api/rembg', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const objectURL = URL.createObjectURL(blob);
            cutoutImage.src = objectURL;
        } else {
            alert("Background removal failed.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});
