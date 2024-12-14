$(document).ready(function () {
    const typingForm = $(".typing-form");
    const chatContainer = $(".chat-list");
    const suggestions = $(".suggestion");
    const toggleThemeButton = $("#theme-toggle-button");
    const deleteChatButton = $("#delete-chat-button");

    // State variables
    let userMessage = null;
    let isResponseGenerating = false;

    // Load theme and chat data from local storage on page load
    const loadDataFromLocalstorage = () => {
        const savedChats = localStorage.getItem("saved-chats");
        const isLightMode = (localStorage.getItem("themeColor") === "light_mode");
        // Apply the stored theme
        $("body").toggleClass("light_mode", isLightMode);
        toggleThemeButton.text(isLightMode ? "dark_mode" : "light_mode");
        // Restore saved chats or clear the chat container
        chatContainer.html(savedChats || '');
        $("body").toggleClass("hide-header", savedChats);
        chatContainer.scrollTop(chatContainer[0].scrollHeight); // Scroll to the bottom
    }

    // Create a new message element and return it
    const createMessageElement = (content, ...classes) => {
        return $("<div>").addClass("message").addClass(...classes).html(content);
    }

    // Show typing effect by displaying words one by one
    const showTypingEffect = (text, textElement, incomingMessageDiv) => {
        const words = text.split(' ');
        let currentWordIndex = 0;
        const typingInterval = setInterval(() => {
            // Append each word to the text element with a space
            textElement.text(textElement.text() + (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++]);
            incomingMessageDiv.find(".icon").addClass("hide");
            // If all words are displayed
            if (currentWordIndex === words.length) {
                clearInterval(typingInterval);
                isResponseGenerating = false;
                incomingMessageDiv.find(".icon").removeClass("hide");
                localStorage.setItem("saved-chats", chatContainer.html()); // Save chats to local storage
            }
            chatContainer.scrollTop(chatContainer[0].scrollHeight); // Scroll to the bottom
        }, 75);
    }

    // Fetch response from the chatbot API based on user message
    const generateAPIResponse = (incomingMessageDiv) => {
        const textElement = incomingMessageDiv.find(".text"); // Getting text element
    
        $.ajax({
            url: "http://127.0.0.1:5000/ask", // The chatbot API URL
            type: "POST", // Request method
            contentType: "application/json",
            data: JSON.stringify({ question: userMessage }),
            success: function (data) {
                if (!data) throw new Error('API Error');
                
                let apiResponse = data.answer || "Sorry, I didn't understand that.";
    
                showTypingEffect(apiResponse, textElement, incomingMessageDiv); // Show typing effect
            },
            error: function (error) {
                isResponseGenerating = false;
                textElement.text("Sorry, something went wrong. Please try again later.");
                textElement.closest(".message").addClass("error");
            },
            complete: function () {
                incomingMessageDiv.removeClass("loading");
            }
        });
    };

    // Show a loading animation while waiting for the API response
    const showLoadingAnimation = () => {
        const html = `<div class="message-content">
                        <img class="avatar" src="assets/images/ImportedPhoto.754388326.798846-removebg-preview.png" alt="edu hyd">
                        <p class="text"></p>
                        <div class="loading-indicator">
                            <div class="loading-bar"></div>
                            <div class="loading-bar"></div>
                            <div class="loading-bar"></div>
                        </div>
                    </div>
                    <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;
        const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
        chatContainer.append(incomingMessageDiv);
        chatContainer.scrollTop(chatContainer[0].scrollHeight); // Scroll to the bottom
        generateAPIResponse(incomingMessageDiv);
    }

    // Copy message text to the clipboard
    const copyMessage = (copyButton) => {
        const messageText = $(copyButton).closest('.message').find(".text").text();
        navigator.clipboard.writeText(messageText);
        $(copyButton).text("done"); // Show confirmation icon
        setTimeout(() => $(copyButton).text("content_copy"), 1000); // Revert icon after 1 second
    }

    // Handle sending outgoing chat messages
    const handleOutgoingChat = () => {
        userMessage = typingForm.find(".typing-input").val().trim() || userMessage;
        if (!userMessage || isResponseGenerating) return; // Exit if there is no message or response is generating
        isResponseGenerating = true;
        const html = `<div class="message-content">
                        <img class="avatar" src="assets/images/user.png" alt="User avatar">
                        <p class="text"></p>
                    </div>`;
        const outgoingMessageDiv = createMessageElement(html, "outgoing");
        outgoingMessageDiv.find(".text").text(userMessage);
        chatContainer.append(outgoingMessageDiv);

        typingForm[0].reset(); // Clear input field
        $("body").addClass("hide-header");
        chatContainer.scrollTop(chatContainer[0].scrollHeight); // Scroll to the bottom
        setTimeout(showLoadingAnimation, 500); // Show loading animation after a delay
    }

    // Toggle between light and dark themes
    toggleThemeButton.click(() => {
        const isLightMode = $("body").toggleClass("light_mode").hasClass("light_mode");
        localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
        toggleThemeButton.text(isLightMode ? "dark_mode" : "light_mode");
    });

    // Delete all chats from local storage when button is clicked
    deleteChatButton.click(() => {
        if (confirm("Are you sure you want to delete all the chats?")) {
            localStorage.removeItem("saved-chats");
            loadDataFromLocalstorage();
        }
    });

    // Set userMessage and handle outgoing chat when a suggestion is clicked
    suggestions.each(function () {
        $(this).click(function () {
            userMessage = $(this).find(".text").text();
            handleOutgoingChat();
        });
    });

    // Prevent default form submission and handle outgoing chat
    typingForm.submit((e) => {
        e.preventDefault();
        handleOutgoingChat();
    });

    const voiceNoteButton = $("#voice-note-button");
    let isListening = false;

    // Configure SpeechRecognition (Web Speech API)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US"; // Set language to English (US)
    // recognition.lang = "ur-PK";
    // Start voice recognition
    voiceNoteButton.click(() => {
        if (isListening) {
            recognition.stop();
            isListening = false;
            voiceNoteButton.removeClass("recording");
        } else {
            recognition.start();
            isListening = true;
            voiceNoteButton.addClass("recording");
        }
    });

    // Handle voice input result
    recognition.addEventListener("result", (event) => {
        const transcript = event.results[0][0].transcript.trim();
        typingForm.find(".typing-input").val(transcript);
        isListening = false;
        voiceNoteButton.removeClass("recording");
    });

    // Handle recognition errors
    recognition.addEventListener("error", (event) => {
        console.error("Speech recognition error:", event.error);
        isListening = false;
        voiceNoteButton.removeClass("recording");
    });

    // Handle recognition end (when user stops speaking)
    recognition.addEventListener("end", () => {
        isListening = false;
        voiceNoteButton.removeClass("recording");
    });

    // Load previously saved data
    loadDataFromLocalstorage();

    // Additional functionality for welcome text and TTS
    const $welcomeText = $("#welcomeText");
    const currentHour = new Date().getHours(24);
    let greeting;

    if (currentHour >= 5 && currentHour < 12) {
        greeting = "Good Morning!";
    } else if (currentHour >= 12 && currentHour < 17) {
        greeting = "Good Afternoon!";
    } else {
        greeting = "Good Evening!";
    }

    $welcomeText.text(greeting);
    $welcomeText.css("opacity", 1); // Fade-in effect

    const $playResponseButton = $('#play-response-button');

    // Text-to-Speech (TTS) Function
    function speakResponse(responseText) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(responseText);
            utterance.lang = 'en-US';
            utterance.pitch = 1; // Voice pitch (default is 1)
            utterance.rate = 1; // Speed of speech (default is 1)
            utterance.volume = 1; // Volume (0 to 1)

            // Speak the text
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Text-to-Speech is not supported in this browser.');
        }
    }

    // Play TTS response when button is clicked
    $playResponseButton.click(function () {
        const lastMessage = chatContainer.find('.message.outgoing').last().find('.text').text();
        if (lastMessage) {
            speakResponse(lastMessage);
        }
    });
});
