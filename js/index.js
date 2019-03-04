const chosenWordField = document.getElementById('chosen-word-input');
const chosenWordLabel = document.getElementById('chosen-word-label');
const valueSelectionContainer = document.querySelector('.value-selection');
const valueControls = document.querySelector(".value-control-container");
const particleParent = document.querySelector(".particle-parent");
const generateButton = document.getElementById("generate-button");
const nameOutput = document.querySelector('.name-output');
const outputTray = document.querySelector('.output-tray');
const leftScroll = document.querySelector('.value-selection-parent .left');
const rightScroll = document.querySelector('.value-selection-parent .right');




let valueList;
let nameList;
let selectedValues = {};
let chosenWord;

const config = {
    apiKey: "AIzaSyCsEgB5rpn8Bm5myQLrm7JgWztpzW2lnWU",
    authDomain: "name-value-store.firebaseapp.com",
    databaseURL: "https://name-value-store.firebaseio.com",
    projectId: "name-value-store",
    storageBucket: "name-value-store.appspot.com",
    // messagingSenderId: "625598566234"
};

firebase.initializeApp(config);

// See below for securing firebase to only one URL. Plz don't hack me 😢
// https://stackoverflow.com/questions/37482366/is-it-safe-to-expose-firebase-apikey-to-the-public
// https://console.developers.google.com/apis

// Get a reference to the database service
var database = firebase.database();



//scroll controls

// Scroll helpers for the values list. Shows + hides the scroll buttons based on position of scroll
const calculateScroll = () => {
    let scrollPos = valueSelectionContainer.scrollLeft;
    let maxWidth = valueSelectionContainer.scrollWidth - valueSelectionContainer.clientWidth;

    if(scrollPos > 10) {
        leftScroll.style.visibility = 'visible';
    }
    else {
        leftScroll.style.visibility = 'hidden';
    }

    if (maxWidth - scrollPos < 10) {
        rightScroll.style.visibility = 'hidden';
    }
    else {
        rightScroll.style.visibility = 'visible';
    }

};


leftScroll.addEventListener('click', ()=> {
    let scrollOptions = {
        left: valueSelectionContainer.scrollLeft - 300,
        top: 0,
        behavior: 'smooth'
    };
   valueSelectionContainer.scrollTo(scrollOptions);
});

rightScroll.addEventListener('click', ()=> {
    let scrollOptions = {
        left: valueSelectionContainer.scrollLeft + 300,
        top: 0,
        behavior: 'smooth'
    };
    valueSelectionContainer.scrollTo(scrollOptions);
});


//gets the names and the values from their JSON files.
// There's almost certainly a better way to do this! 😅
fetchJSON = () => {

    let snapshot;

    // gets the snapshot from the server. returns a promise
    let getSnapshot = () => {
        return database.ref().once('value').then((snap) => {
            snapshot = snap.val();
            return snap;
        });
    };


    let fetchValues = () => {
        return new Promise(resolve => {
            valueList = snapshot.values;
            resolve();
        })
    };

    let fetchNames = () => {
        return new Promise(resolve => {
            nameList = snapshot.names;
            resolve();
        });


    };


    return new Promise(resolve => {

        getSnapshot()
            .then(fetchValues)
            .then(fetchNames)
            .then(() => {
                resolve();
            })



        // snapshot
        //     .then(fetchValues.bind(this,snapshot))
        //     .then(fetchNames.bind(this,snapshot))
        //     .then(()=> {
        //         resolve();
        // })

    });


};

let deleteSliderFunctions = [];

//Creates a value slider, which allows you to control how important a value is for the naming.
// Also creates labels, and allows you to erase a value.
const createValueSlider = (value, button) => {
    let container = document.createElement('div');
    container.classList.add('value-control');

    let tooltip = document.createElement('span');
    tooltip.innerHTML = valueList[value].name;
    tooltip.classList.add('tooltip');

    let icon = document.createElement('span');
    icon.classList.add('fas',`fa-${valueList[value].icon}`, 'value-icon');
    icon.appendChild(tooltip);


    let slider = document.createElement('input');
    slider.type = 'range';
    slider.max = '1';
    slider.min = '-1';
    slider.value = '0';
    slider.step = '0.05';


    let particle = document.createElement('span');
    particle.classList.add('fas',`fa-${valueList[value].icon}`);

    let interval;

    interval = setInterval(()=> {
        particleEffect(particle, particleParent, 2, 50);
    }, 750);


    let onInput = (event) => {
        selectedValues[value] = Number(event.target.value);

        clearInterval(interval);
        interval = setInterval(()=> {
            particleEffect(particle, particleParent, Math.round(event.target.value), 50);
        }, 750);
    };
    slider.addEventListener("input", onInput);




    // deletes the value from the machine
    let deleteValue = () => {
        delete selectedValues[value];
        container.remove();
        clearInterval(interval);

        if (Object.keys(selectedValues).length === 0) {
            generateButton.classList.add('disabled')
        }

        //    add the value back to the list:
        button.style.position = null;
        button.style.left = null;
        button.style.top = null;
        button.style.transition = null;
        button.style.transform = null;


        // removes the delete function for the array, since it was already called
        // deleteSliderFunctions.splice(deleteSliderFunctions.indexOf(deleteValue) , 1);

    };

    //adds the delete function to an array, so they can all be called at once
    deleteSliderFunctions.push(deleteValue);


    let x = document.createElement("span");
    x.classList.add('fas','fa-times', 'delete');
    x.addEventListener("click", deleteValue);

    // container.appendChild(label);
    container.appendChild(icon);
    container.appendChild(slider);
    container.appendChild(x);
    valueControls.append(container);

};


// onClick event for the value selection
const addValueToList = (button) => {
    let value = event.target.value;
    //prevents creating the same value multiple times
    if(selectedValues[value] === undefined) {
        selectedValues[value] = 0;
        createValueSlider(value, button);
    }

    button.style.position = 'absolute';
    button.style.left = '6.5em';
    button.style.top = '4.5em';
    button.style.transition = 'all 1s';

    setTimeout( () => {
        button.style.top = '8em';
        button.style.transform = 'scale(0)'
    }, 200);

    generateButton.classList.remove('disabled')

};



//TODO: make this thing a promise to not have weird async stuff going on.
// picks the name with the smallest number of reviews to give it priority to be ranked
// also sets the value of the
const pickName = () => {
    chosenWord = Object.keys(nameList)[0];

    Object.keys(nameList).forEach((name) => {
            if (nameList[chosenWord].reviews > nameList[name].reviews) {
                chosenWord = name;
            }
    });

    chosenWordField.value = chosenWord;
    chosenWordLabel.innerText = chosenWord;
};

// lists all of the values in an array
const generateValues = () => {
    return new Promise(resolve => {
        for (let value in valueList) {
            let button = document.createElement('button');
            let text = document.createElement('p');
            //apparently, we need to assign a value to EVERYTHING 🙄
            text.value = value;
            text.innerHTML = valueList[value].name;

            let icon = document.createElement('span');
            icon.value = value;
            icon.classList.add('fas',`fa-${valueList[value].icon}`, );
            button.appendChild(icon);

            button.appendChild(text);
            button.value = value;
            button.addEventListener("click", addValueToList.bind(this, button));

            let bolt1 = document.createElement('div');
            bolt1.classList.add('bolt', 'top-left');
            let bolt2 = document.createElement('div');
            bolt2.classList.add('bolt', 'top-right');
            let bolt3 = document.createElement('div');
            bolt3.classList.add('bolt', 'bottom-right');
            let bolt4 = document.createElement('div');
            bolt4.classList.add('bolt', 'bottom-left');
            button.appendChild(bolt1);
            button.appendChild(bolt2);
            button.appendChild(bolt3);
            button.appendChild(bolt4);

            valueSelectionContainer.appendChild(button);

            resolve()
        }
        valueSelectionContainer.addEventListener('scroll', calculateScroll);



    });

};


// TODO: refactor to save to DB... stuff bellow return is mostly un-needed
// generates a list of names based on the values chosen
const saveTagging = () => {


    // saves the data
    if(nameList[chosenWord]) {

        let previousReviews = nameList[chosenWord].reviews;

        let wordData = nameList[chosenWord];

        // if there's values already logged, multiply them by
        // the # of reviews that have been made previously
        if(wordData.values) {
            Object.keys(wordData.values).forEach((value) => {
                wordData.values[value] = wordData.values[value] * previousReviews;
            })
        }

        // increments reviews to include the current one
        wordData.reviews += 1;

        // if there's no values object for the word yet, create it.
        if(!wordData.values) {
            wordData.values = {};
        }


        // values are added to wordData
        Object.keys(selectedValues).forEach((value) => {
            // basically, this isn't properly saving the value to the wordData object 😠
            // can't perform operations on value with nothing in it, so it needs to be initialised to 0 if empty
            if (!wordData.values[value]) {
                wordData.values[value] = 0;
            }
            wordData.values[value] = selectedValues[value] + wordData.values[value];
        });


        // values are divided by the number of total reviews
        if(wordData.values) {
            Object.keys(wordData.values).forEach((value) => {
                wordData.values[value] = Math.round((wordData.values[value] / wordData.reviews) * 100 ) /100;
            })
        }

        // updates local data
        nameList[chosenWord] = wordData;

        //updates the record of the word to the DB
        database.ref().child('names').child(chosenWord).set(nameList[chosenWord]);

    }
    else {

        // updates the data for the word locally
        nameList[chosenWord] = {
            'reviews' : 1,
            'values' : selectedValues
        };


        //updates the record of the word to the DB
        database.ref().child('names').child(chosenWord).set(nameList[chosenWord]);
    }


    // disables activate button
    generateButton.classList.add('disabled');

    // opens the furnace door
    let outputFrame = document.querySelector('.output-frame');
    outputFrame.classList.add('open');

    // puts names into the DOM
    let result = document.createElement('h5');
    result.classList.add('result');
    result.innerHTML = chosenWord;
    result.style.opacity = '0';


    nameOutput.appendChild(result);

    // pushes the word on the conveyor then into the trapdoor
    setTimeout(() => {
        result.style.opacity = '1';
        result.style.transition = 'all 1.55s linear';
        setTimeout(() => {
            result.style.top = '3.5em';
            result.style.transform = 'scale(1.25)';


            setTimeout(() => {
                result.style.transition = 'all 0.75s cubic-bezier(0.55, 0.085, 0.68, 0.53)';
                result.style.top = '7em';
                result.style.transform = 'scale(1.45)';
                result.style.color = '#FF9800';

                // closes the goddamn (oven) door
                // No, it's much better to face these kinds of things
                // with a sense of poise and rationality 🎩
                outputFrame.classList.remove('open');
                generateButton.classList.remove('disabled');

                setTimeout(()=> {
                    // opens the goddamn (trap)door, no...
                    outputTray.classList.add('open');
                    result.style.transform = 'scale(0.05)';
                    result.style.top = '7.5em';

                    setTimeout(() => {
                        outputTray.classList.remove('open');
                        result.remove();
                    }, 1000);
                }, 1000);



            }, 1600)
        }, 500);
    }, 350);


    // animates the button
    generateButton.classList.add('activated');
    setTimeout(() => {
        generateButton.classList.remove('activated');
    }, 850);


    //calls the delete functions for all of the the preselected values
    deleteSliderFunctions.forEach((deleteFunction) => {
        deleteFunction();
    });

    //picks a new word
    pickName();


};


generateButton.addEventListener("click", saveTagging);



const updateChosenName = () => {
    let word = event.target.value;
    chosenWord = word;
    chosenWordLabel.innerText = word;
};

chosenWordField.addEventListener('change', updateChosenName);



//✨ANIMATION_HELPERS
// creates new particles and puts them in the specified parent
let createParticles = (element, parent, quantity) => {
    element.classList.add('particle', 'new');

    for (let i = 0; i < quantity; i++) {
        let newElement = element.cloneNode(true);
        parent.appendChild(newElement);
    }

    // waits 10 millis for element to properly render.
    //TODO replace timeout with the actual event that detects the element's render state
    return new Promise((resolve) => {
        setTimeout( () => {
            resolve();
        }, 20);
    })
};

//✨ANIMATION_HELPERS
// takes the particles in a parent and disperses them
let disperseParticles = (parent, area) => {

    return new Promise(resolve => {

        parent.querySelectorAll('.particle.new').forEach((particle) => {
            let topModifier = Math.floor(Math.random()*area);
            let leftModifier = Math.floor(Math.random()*area);
            let leftPositive = Math.round(Math.random()) === 1;
            let rotatePositive = Math.round(Math.random()) === 1;
            let topVal = -topModifier * 6 - 100;
            let leftVal = leftPositive ? 40 + leftModifier : -leftModifier + 40;
            let rotation =  Math.round(Math.random() * 90) * (rotatePositive ? 1 : -1 );

            particle.addEventListener('transitionend', (event) => {
                event.target.remove();
                //resolves the promise once the transition ends
                resolve();
            });

            particle.style.opacity = '0';
            particle.style.top = `${topVal}%`;
            particle.style.left = `${leftVal}%`;
            particle.style.transform = `rotate(${rotation}deg`;

            particle.classList.remove('new');
        });

    });


};

//✨ANIMATION_HELPERS
// returns a Promise
 let particleEffect = (element, parent, quantity, area) => {

    return new Promise(resolve => {
        createParticles(element,parent,quantity)
            .then(()=> {
                disperseParticles(parent, area)
                    .then(()=> {
                        resolve();
                        //    particle render is complete
                    });
            })
    });

};


 let renderPipes = () => {
     return new Promise(resolve => {
         let pipes = Array.from(document.querySelectorAll('.pipe'));

         let bolt = document.createElement('div');
         bolt.classList.add('bolt');

         let joint = document.createElement('div');
         joint.classList.add('pipe-joint');
         joint.appendChild(bolt.cloneNode(true));
         joint.appendChild(bolt.cloneNode(true));

         pipes.forEach((pipe) => {
             let quantity = Math.ceil(Math.random() * 3);

             for (let i = 0; i < quantity; i++) {
                 pipe.appendChild(joint.cloneNode(true));
             }

         });
         resolve();
     })
 };




// Lifecycle event that runs after all the content is loaded to the DOM
document.addEventListener('DOMContentLoaded', (event) => {
    fetchJSON()
        .then(generateValues)
        .then(() => {
            renderPipes();
            let particle = document.createElement('span');
            particle.classList.add('fas','fa-circle');

            setInterval(()=> {
                particleEffect(particle, particleParent, 1, 50);
            }, 750);

            pickName();

            // for (let name in nameList) {
            //     database.ref().child('names').child(name).child('reviews').set(1);
            // }

        });

});



