// Much of this is based off this Google SpeechRecognition demo
// https://github.com/googlearchive/webplatform-samples/blob/master/webspeechdemo/webspeechdemo.html

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
var final_transcripts = {};
var start_timestamp = 0;
var prevTranscript = "";

recognition.interimResults = true;
recognition.continuous = true;
recognition.grammars = speechRecognitionList;
recognition.lang = "en-US";
// recognition.maxAlternatives = 1;

const emojiPhrases = {};

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
    final_transcripts = {};
    recognition.start();
    start_timestamp = event.timeStamp;
    ignore_onend = false;
    startButton.textContent = 'Recording...';
});

recognition.onresult = event => {
    console.info("result", event.results);
    var interim_transcript = '';
    outputDiv.querySelectorAll(`div.transcript[data-id="${i}"]`).forEach((el) => {
        if(el.classList.indexOf('final') < 0) {
            el.innerHTML = "";
        }
    });
    for (var i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptDiv = outputDiv.querySelector(`div.transcript[data-id="${i}"]`) || document.createElement("div");
        if(!transcriptDiv.classList.contains('transcript')) {
            transcriptDiv.setAttribute('data-id', i);
            transcriptDiv.classList.add('transcript');
            outputDiv.appendChild(transcriptDiv);
        }
        const transcriptEmojiDiv = emojiDiv.querySelector(`div.transcript[data-id="${i}"]`) || document.createElement("div");
        if(!transcriptEmojiDiv.classList.contains('transcript')) {
            transcriptEmojiDiv.setAttribute('data-id', i);
            transcriptEmojiDiv.classList.add('transcript');
            emojiDiv.appendChild(transcriptEmojiDiv);
        }
        const transcriptText = event.results[i][0].transcript;
        const transcript = final_transcripts[transcriptText] || {};
        const transcriptMatches = transcript.matches || getAllEmoji(transcriptText);
        const transcriptHtml = transcript.html || indivLettersHtml(transcriptText, transcriptMatches);
        const transcriptEmoji = transcript.emoji || getEmojiString(transcriptText, transcriptMatches);
        
        if (event.results[i].isFinal) {
            final_transcript += transcriptText;
            final_transcripts[transcriptText] = transcript;
            transcript.matches = transcriptMatches;
            transcript.html = transcriptHtml;
            transcript.emoji = transcriptEmoji;
            if(!transcriptDiv.classList.contains('final')) {
                transcriptDiv.innerHTML = transcriptHtml;
                transcriptDiv.classList.add('final');
            }
            if(!transcriptEmojiDiv.classList.contains('final')) {
                transcriptEmojiDiv.textContent = transcriptEmoji;
                transcriptEmojiDiv.classList.add('final');
            }
        } else {
            interim_transcript += transcriptText;
            transcriptDiv.innerHTML = transcriptHtml;
            transcriptEmojiDiv.textContent = transcriptEmoji;
        }
    }
    const result = final_transcript || interim_transcript; // event.results[event.results.length - 1][0].transcript;
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

function indivLettersHtml(full, matches) {
    let html = "";
    full.split('').forEach((letter, i) => {
        let emHtml = "";
        if(matches[i]) {
            for (const [phrase, emojis] of Object.entries(matches[i])) {
                Object.keys(matches[i][phrase]).forEach((key) => {
                    emHtml += `<div class="emoji">${key}</div>`;
                });
            }
            emHtml = `<div class="matching-emoji">${emHtml}</div>`;
            html += `<span class="has-matches">${letter}${emHtml}</span>`;
        } else {
            html += `<span>${letter}</span>`;
        }
    });
    return html;
}

function getAllEmoji(source) {
    console.info("searching for matching emoji...", source);
    let foundString = "";
    let found = {};
    source = source.toUpperCase().replace('_', ' ').replace('-', ' ');

    for (const [phrase, emojis] of Object.entries(emojiPhrases)) {
        let toSearch = source;
        let start = 0;
        while(toSearch.length > 0 && toSearch.length >= phrase.length) {
            const relIn = toSearch.indexOf(phrase);
            if(relIn >= 0) {
                const absIn = start + relIn;
                found[absIn] = found[absIn] || {};
                found[absIn][phrase] = emojis;
                start = absIn + phrase.length;
                toSearch = source.substring(start);
            } else {
                break;
            }
        }
    }

    return found;
}

function getEmojiString(full, matches) {
    let fullString = "";
    for(let i = 0; i < full.length; i++) {
        if(matches[i]) {
            const phrases = Object.keys(matches[i]).sort((a, b) => b.length - a.length);
            const emojis = matches[i][phrases[0]];
            fullString += Object.keys(emojis)[0];
            i += phrases[0].length - 1;
        }
    }
    return fullString;
}

function mergeObj(primary, copyFrom) {
    for (const [key, val] of Object.entries(copyFrom)) {
        if(typeof val === 'object' && primary[key]) {
            if(Array.isArray(val)) {
                for (let i = 0; i < val.length; i++) {
                    if(primary[key].indexOf(val[i]) < 0) {
                        primary[key].push(val[i]);
                    }
                }
            } else {
                primary[key] = Object.assign(primary[key], val);
            }
        } else {
            primary[key] = val;
        }
    }
    return primary;
}

// https://github.com/github/gemoji/blob/master/db/emoji.json
fetch('./js/emoji.json')
    .then((response) => response.json())
    .then((data) => {
        emojiGem = data;
        // https://github.com/vdurmont/emoji-java/blob/master/src/main/resources/emojis.json
        return fetch('./js/emoji-java.json');
    })
    .then((response) => response.json())
    .then((data) => {
        emojiJava = data;
        // https://github.com/kcthota/emoji4j/blob/master/src/main/resources/emoji.json
        return fetch('./js/emoji4j.json');
    })
    .then((response) => response.json())
    .then((data) => {
        emoji4j = data;
        emojiNew = emoji4j;
        emojiJava.forEach((emojiFrom) => {
            let found = false;
            emojiFrom.emojiUtf = emojiFrom.emoji;
            emojiFrom.emoji = emojiFrom.emojiChar;
            for (let index = 0; index < emojiNew.length; index++) {
                if(emojiNew[index].emoji === emojiFrom.emojiChar) {
                    emojiNew[index] = mergeObj(emojiNew[index], emojiFrom);
                    found = true;
                    break;
                }
            }
            if(!found) {
                emojiNew.push(emojiFrom);
            }
        });
        emojiGem.forEach((emojiFrom) => {
            let found = false;
            for (let index = 0; index < emojiNew.length; index++) {
                if(emojiNew[index].emoji === emojiFrom.emoji) {
                    emojiNew[index] = mergeObj(emojiNew[index], emojiFrom);
                    found = true;
                    break;
                }
            }
            if(!found) {
                emojiNew.push(emojiFrom)
            }
        });

        emojiDefine = emojiNew;

        emojiDefine.forEach((emojiType) => {
            if(emojiType.description) {
                let desc = emojiType.description.toUpperCase().replace('_', ' ').replace('-', ' ');
                if(emojiType.category === "Smileys & Emotion") {
                    desc = desc.replace(/\s*face\s*/ig, ' ').trim()
                } else if(emojiType.category === "Symbols") {
                    desc = desc.replace(/\s*square$/ig, '').trim()
                } else if(emojiType.category === "Flags") {
                    desc = desc.replace(/^flag: */ig, '').trim()
                }
                if(desc.length > 2) {
                    emojiPhrases[desc] = emojiPhrases[desc] || {};
                    emojiPhrases[desc][emojiType.emoji] = emojiType;
                }
            }
            if(emojiType.aliases) {
                emojiType.aliases.forEach((alias) => {
                    const temp = alias.toUpperCase().replace('_', ' ').replace('-', ' ');
                    if(temp.length > 2) {
                        emojiPhrases[temp] = emojiPhrases[temp] || {};
                        emojiPhrases[temp][emojiType.emoji] = emojiType;
                    }
                });
            }
            if(emojiType.tags) {
                emojiType.tags.forEach((tag) => {
                    const temp = tag.toUpperCase().replace('_', ' ').replace('-', ' ');
                    if(temp.length > 2) {
                        emojiPhrases[temp] = emojiPhrases[temp] || {};
                        emojiPhrases[temp][emojiType.emoji] = emojiType;
                    }
                });
            }
        });
    });

