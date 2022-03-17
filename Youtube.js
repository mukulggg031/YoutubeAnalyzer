const puppeteer = require("puppeteer");
//npm install pdfkit
const pdf = require("pdfkit");
const fs = require("fs");
let cTab;
let link = 'https://www.youtube.com/playlist?list=PLW-S5oymMexXTgRyT3BWVt_y608nt85Uj';
// let link = 'https://www.youtube.com/playlist?list=PL-Jc9J83PIiEp9DKNiaQyjuDeg3XSoVMR';
(async function(){
    try{
        let browserOpen = puppeteer.launch({
            headless : false,
            defaultViewport : null,
            args : ['--start-maximized']
        })

        let browserInstance = await browserOpen;
        let allTabsArr = await browserInstance.pages()
        cTab = allTabsArr[0]
        await cTab.goto(link);
        await cTab.waitForSelector('h1#title');
        let name = await cTab.evaluate(function(select){
            return document.querySelector(select).innerText
        }, 'h1#title');
        console.log(name);
        
        let allData = await cTab.evaluate(getData ,'#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer');
        console.log(name, allData.noOfVideos, allData.noOfViews);
        
        let totalVideos = allData.noOfVideos.split(" ")[0];
        console.log(totalVideos);

        let currentVideos = await getCVideosLength();
        console.log(currentVideos);

        while(totalVideos - currentVideos >= 5){
            await scrollToBottom();
            currentVideos = await getCVideosLength()
        }

        let finalList = await getStats();

        fs.writeFileSync("data.json", JSON.stringify(finalList).replace(/\\n/g, ''));
        let buffer = fs.readFileSync('data.json');
        let data = JSON.parse(buffer);

        let finaldata = "";
        for(let i = 0 ; i < data.length ; i++){
            let dur = data[i].duration;
            dur = dur.split("\n");
            finaldata += (i + 1) + "->  Title:" + data[i].videoTitle + "\n      Duration:" + dur + "\n";
        }
        let pdfDoc = new pdf;
        pdfDoc.pipe(fs.createWriteStream('pep.pdf'));
        pdfDoc.text(finaldata);
        pdfDoc.end();
    }
    catch(error){

    }
})();

function getData(selector){
    let allElems = document.querySelectorAll(selector);
    let noOfVideos = allElems[0].innerText
    let noOfViews = allElems[1].innerText
    return{
        noOfVideos,
        noOfViews
    }
}

async function getCVideosLength(){
    let length = await cTab.evaluate(getLength, '#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
    return length;
}

function getLength(durationSelect){
    let durationElem = document.querySelectorAll(durationSelect);
    return durationElem.length;
}

async function scrollToBottom(){
    await cTab.evaluate(goToBottom)
    function goToBottom(){
        window.scrollBy(0, window.innerHeight);
    }
}
async function getStats(){
    let list = cTab.evaluate(getNameAndDuration , "#video-title", "#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer");
    return list;

}

function getNameAndDuration(videoSelector, durationSelector){
    let videoElem = document.querySelectorAll(videoSelector);
    let durationElem = document.querySelectorAll(durationSelector);

    let currentList = [];
    for(let i = 0 ; i < durationElem.length ; i++){
        let videoTitle = videoElem[i].innerText;
        let duration = durationElem[i].innerText;

        currentList.push({videoTitle, duration});
    }
    return currentList;
}