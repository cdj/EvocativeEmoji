
const startButton = document.getElementById('startButton');
const outputDiv = document.getElementById('log');
const emojiDiv = document.getElementById('emoji');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;
const recognition = new SpeechRecognition();
const speechRecognitionList = new SpeechGrammarList();
var recognizing = false;
var ignore_onend = false;
var final_transcript = '';
var start_timestamp = 0;
var prevSource = {};

recognition.interimResults = true;
recognition.continuous = true;
recognition.grammars = speechRecognitionList;
recognition.lang = "en-US";
// recognition.maxAlternatives = 1;

startButton.addEventListener('click', (event) => {
    if (recognizing) {
        try {
            recognition.stop();
        } catch(ex) {
            console.warn("still recognizing, force stop", ex);
        }
        return;
    }
    startButton.disabled = true;
    console.info("start btn click");
    final_transcript = '';
    recognition.start();
    start_timestamp = event.timeStamp;
    ignore_onend = false;
    startButton.textContent = 'Recording...';
});

recognition.onresult = event => {
    console.info("result", event.results);
    var interim_transcript = '';
    for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            final_transcript += event.results[i][0].transcript;
        } else {
            interim_transcript += event.results[i][0].transcript;
        }
    }
    const result = final_transcript || interim_transcript; // event.results[event.results.length - 1][0].transcript;
    outputDiv.textContent = result;
    emojiDiv.textContent = getAllEmoji(result);
};

recognition.onstart = (event) => {
    recognizing = true;
    console.info("start", event);
};
recognition.onend = (event) => {
    recognizing = false;    
    console.info("end; \nignore_onend: " + ignore_onend + "; \nelapsed: " + (event.timeStamp - start_timestamp) + "ms; ", event);
    if (ignore_onend) {
        return;
    }
    startButton.disabled = false;
    startButton.textContent = 'Start Recording';
};

recognition.onerror = event => {
    if (event.error == 'no-speech') {
        ignore_onend = true;
        console.error('Speech recognition error: info_no_speech; ', event.error);
    } else if (event.error == 'audio-capture') {
        ignore_onend = true;
        console.error('Speech recognition error: info_no_microphone; ', event.error);
    } else if (event.error == 'not-allowed') {
        if ((event.timeStamp - start_timestamp) < 100) {
            console.error('Speech recognition error: info_blocked; ', event.error);
        } else {
            console.error('Speech recognition error: info_denied; ', event.error);
        }
        ignore_onend = true;
    } else {
        console.error('Speech recognition error:', event.error);

    }
};

recognition.onnomatch = (event) => {
    console.log('No speech was recognized.', event);
};
recognition.onaudioend = (event) => {
    console.info("audioend", event);
}
recognition.onaudiostart = (event) => {
    console.info("audiostart", event);
}
recognition.onsoundend = (event) => {
    console.info("soundend", event);
}
recognition.onsoundstart = (event) => {
    console.info("soundstart", event);
}
recognition.onspeechend = (event) => {
    console.info("speechend", event);
}
recognition.onspeechstart = (event) => {
    console.info("speechstart", event);
}

function getAllEmoji(source) {
    if (Object.keys(prevSource).indexOf(source) >=0) return prevSource[source];
    console.info("searching for matching emoji...", source);
    let foundString = "";
    let found = [];
    prevSource = source;
    source = source.toUpperCase().replace('_', ' ').replace('-', ' ');
  
    emojiDefine.forEach((emojiType) => {
        let foundPosition = -1;
        let temp = -1;
        if(emojiType.description && emojiType.description.length > 2) {
            // console.info("  searching description...");
            let desc = emojiType.description.toUpperCase().replace('_', ' ').replace('-', ' ');
            if(emojiType.category === "Smileys & Emotion") {
                desc = desc.replace(/\s*face\s*/ig, ' ').trim()
            } else if(emojiType.category === "Symbols") {
                desc = desc.replace(/\s*square$/ig, '').trim()
            } else if(emojiType.category === "Flags") {
                desc = desc.replace(/^flag: */ig, '').trim()
            }
            temp = source.indexOf(desc);
            if(temp >= 0) {
                console.info("match: " + emojiType.description, temp, foundPosition);
                if(temp < foundPosition || foundPosition < 0) {
                    foundPosition = temp;
                }
            }
        }
        if(emojiType.aliases && emojiType.aliases.length > 0) {
            // console.info("  searching aliases...");
            emojiType.aliases.forEach((alias) => {
                temp = source.indexOf(alias.toUpperCase().replace('_', ' ').replace('-', ' '));
                if(temp >= 0 && alias.length > 2) {
                    console.info("match: " + alias, temp, foundPosition);
                    if(temp < foundPosition || foundPosition < 0) {
                        foundPosition = temp;
                    }
                }
            });
        }
        if(emojiType.tags && emojiType.tags.length > 0) {
            // console.info("  searching tags...");
            emojiType.tags.forEach((tag) => {
                temp = source.indexOf(tag.toUpperCase().replace('_', ' ').replace('-', ' '));
                if(temp >= 0 && tag.length > 2) {
                    console.info("match: " + tag, temp, foundPosition);
                    if(temp < foundPosition || foundPosition < 0) {
                        foundPosition = temp;
                    }
                }
            });
        }
        if(foundPosition >= 0) {
            console.info("found");
            found.push({
                position: foundPosition,
                emoji: emojiType
            });
        }
    });

    if(found.length > 0) {
        console.info("found emoji: " + found.length);

        found.sort((a, b) => a.position - b.position);

        found.forEach((item) => foundString += item.emoji.emoji);
    }

    return foundString;
}
