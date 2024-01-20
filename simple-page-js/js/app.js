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

recognition.interimResults = true;
recognition.continuous = true;
recognition.grammars = speechRecognitionList;
recognition.lang = "en-US";
// recognition.maxAlternatives = 1;

String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

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
    outputDiv.querySelectorAll(`div.transcript`).forEach((el) => {
        if(!el.classList.contains('final')) {
            el.remove();
        }
    });
    for (var i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptText = event.results[i][0].transcript;
        const transcriptHash = transcriptText.hashCode();
        const transcript = final_transcripts[transcriptHash] || {};
        const transcriptDiv = 
            outputDiv.querySelector(`div.transcript[data-hash="${transcriptHash}"]`) || 
            document.createElement("div");

        if(!transcriptDiv.classList.contains('transcript')) {
            // transcriptDiv.setAttribute('data-id', i);
            transcriptDiv.setAttribute('data-hash', transcriptHash);
            transcriptDiv.classList.add('transcript');
            outputDiv.appendChild(transcriptDiv);
        }
        const transcriptEmojiDiv = emojiDiv.querySelector(`div.transcript[data-id="${i}"]`) || document.createElement("div");
        if(!transcriptEmojiDiv.classList.contains('transcript')) {
            transcriptEmojiDiv.setAttribute('data-id', i);
            transcriptEmojiDiv.classList.add('transcript');
            emojiDiv.appendChild(transcriptEmojiDiv);
        }
        
        if (event.results[i].isFinal) {
            const transcriptMatches = transcript.matches || getAllMatchingEmoji(transcriptText);
            const transcriptObj = transcript.obj || getDisplayInfo(transcriptText, transcriptMatches);
            final_transcript += transcriptText;
            final_transcripts[transcriptHash] = transcript;
            transcript.matches = transcriptMatches;
            transcript.obj = transcriptObj;
            if(!transcriptDiv.classList.contains('final')) {
                transcriptDiv.innerHTML = transcript.obj.letterSentenceHtml;
                transcriptDiv.classList.add('final');
            }
            if(!transcriptEmojiDiv.classList.contains('final')) {
                transcriptEmojiDiv.textContent = transcript.obj.replacedWithEmojiString;
                // transcriptEmojiDiv.textContent = transcript.obj.emojiString;
                transcriptEmojiDiv.classList.add('final');
            }
        } else {
            interim_transcript += transcriptText;
            transcriptDiv.innerHTML = transcriptText;
            // transcriptEmojiDiv.textContent = transcriptObj.emojiString;
            // transcriptEmojiDiv.textContent = transcriptObj.replacedWithEmojiString;
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

function getDisplayInfo(full, matches) {
    const toDisplay = {
        letterSentenceHtml: "",
        emojiString: "",
        replacedWithEmojiString: ""
    };
    let html = "";
    const letters = full.split('');
    let workingString = full;
    let workingStringUp = full.toUpperCase().replaceAll('_', ' ');;
    console.info("getDisplayInfo matches", matches);
    for (let l = letters.length - 1; l += 0; l--) {
        const letter = letters[l];
        if(matches[l]) {
            const phrases = Object.keys(matches[l]).sort((a, b) => b.length - a.length);
            for (let p = 0; p < phrases.length; p++) {
                const phrase = phrases[p];
                const last = workingStringUp.lastIndexOf(phrase);
                console.log("lastind", workingString, phrase, last);
                if(last >= 0) {
                    const emoji = matches[l][phrase][0];
                    console.info("chosen emoji", emoji);
                    workingString = 
                        workingString.substring(0, last) + 
                        emoji.emoji + 
                        workingString.substring(last + phrase.length, workingString.length);
                    workingStringUp = 
                        workingStringUp.substring(0, last) + 
                        emoji.emoji + 
                        workingStringUp.substring(last + phrase.length, workingStringUp.length);
                    toDisplay.emojiString = emoji.emoji + toDisplay.emojiString;
                    break;
                }
            }
        }
        
    }
    toDisplay.replacedWithEmojiString = workingString;

    letters.forEach((letter, l) => {
        let emHtml = "";
        if(matches[l]) {
            const phrases = Object.keys(matches[l]).sort((a, b) => b.length - a.length);
            for (let p = 0; p < phrases.length; p++) {
                const phrase = phrases[p];
                const emojis = matches[l][phrase]
                for (let e = 0; e < emojis.length; e++) {
                    const emoji = emojis[e];
                    emHtml += `<div class="emoji">${emoji.emoji}${phrase}</div>`;

                    break; // only use 1st one for perf
                }

                break; // only use 1st one for perf
            }
            emHtml = `<div class="matching-emoji">${emHtml}</div>`;
            toDisplay.letterSentenceHtml += `<span class="has-matches">${letter}${emHtml}</span>`;
        } else {
            toDisplay.letterSentenceHtml += `<span>${letter}</span>`;
        }
    });

    return toDisplay;
}

function getAllMatchingEmoji(source) {
    console.info("searching for matching emoji...", source);
    let foundString = "";
    let found = {};
    source = source.toUpperCase().replaceAll('_', ' ');

    for (let p = 0; p < emojiPhrases.length; p++) { // const [phrase, emojis] of Object.entries(emojiPhrases)) {
        const pObj = emojiPhrases[p];
        const phrase = pObj.phrase;
        const emojis = pObj.possible;
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

function getPhraseObj(newPhrase) {
    let phraseObj = null;

    for (let index = 0; index < emojiPhrases.length; index++) {
        const existPObj = emojiPhrases[index];
        if (existPObj.phrase === newPhrase) {
            phraseObj = existPObj;
            break;
        }
    }

    if (!phraseObj) {
        phraseObj = {
            phrase: newPhrase,
            possible: []
        };
        emojiPhrases.push(phraseObj);
    }

    return phraseObj;
}


function addTypeToPhrase(phraseObj, emojiType) {
    let typeFound = false;

    for (let j = 0; j < phraseObj.possible.length; j++) {
        if(phraseObj.possible[j].emoji === emojiType.emoji) {
            typeFound = true;
            break;
        }
    }

    if(!typeFound) {
        phraseObj.possible.push(emojiType);
    }
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

        // build new obj to easily search for emoji by phrase, ie thesaurus
        emojiDefine.forEach((emojiType) => {
            if(emojiType.description) {
                let desc = emojiType.description.toUpperCase().replaceAll('_', ' ');
                if(emojiType.category === "Smileys & Emotion") {
                    desc = desc.replaceAll(/\s*face\s*/ig, ' ');
                } else if(emojiType.category === "Symbols") {
                    if(desc.search(/ (large|small|medium|medium-small) square$/ig)) return;
                    if(desc.search(/^Japanese /ig) && desc.search(/ button$/ig)) return;
                    desc = desc.replaceAll(/ square$/ig, '');
                } else if(emojiType.category === "Flags") {
                    desc = desc.replaceAll(/^flag: /ig, '');
                }
                desc = desc.replaceAll(": ", " ").replaceAll("’", "'").trim();
                if(desc.length > 2) {
                    const phraseObj = getPhraseObj(desc);
                    addTypeToPhrase(phraseObj, emojiType);
                }
            }
            if(emojiType.aliases) {
                emojiType.aliases.forEach((alias) => {
                    const temp = alias.toUpperCase().replaceAll('_', ' ');
                    if(temp.length > 2) {
                        const phraseObj = getPhraseObj(temp);
                        addTypeToPhrase(phraseObj, emojiType);
                    }
                });
            }
            if(emojiType.tags) {
                emojiType.tags.forEach((tag) => {
                    const temp = tag.toUpperCase().replaceAll('_', ' ');
                    if(temp.length > 2) {
                        const phraseObj = getPhraseObj(temp);
                        addTypeToPhrase(phraseObj, emojiType);
                    }
                });
            }
        });

        // reverse sort so longer phrases match first
        emojiPhrases.sort((a, b) => (a.phrase > b.phrase ? -1 : 1));
    });

