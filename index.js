// ==UserScript==
// @name         TimesShowFuel
// @namespace    times_show_fuel
// @version      0.1
// @description  Show Times car share fuel remaining
// @author       stream3715
// @match        https://share.timescar.jp/view/station/stationMap.jsp*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    HTMLElement.prototype.getElementByXPath = function (path) {
        const result = document.evaluate(path, this, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        return result.snapshotLength > 0 ? result.snapshotItem(0) : null;
    }

    const option = { childList: true };

    async function processStationDetail(root, stationId) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', "https://share.timescar.jp/view/reserve/input.jsp?scd=" + stationId);
        xhr.responseType = "document";
        xhr.send();

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const carList = xhr.response.getElementById("timetableHtmlTag");
                const fuelList = Array.from(carList.getElementsByTagName("div")).map(x => {
                    if (!x.getElementByXPath('./table/tbody/tr[2]/td[2]')) {
                        console.error(x.id)
                    }
                    else {
                        return {
                            id: x.id,
                            fuel: x.getElementByXPath('./table/tbody/tr[2]/td[2]').textContent
                        }
                    }
                });

                if (fuelList) {
                    fuelList.map(x => {
                        root.getElementById(x.id).getElementByXPath("./p/a").textContent = root.getElementById(x.id).getElementByXPath("./p/a").textContent + "／" + x.fuel
                    })
                }
            }
        }
    }

    //コールバック関数
    async function callback(mutationsList, observer) {
        observer.disconnect();
        for (const mutation of mutationsList) {
            if (mutation.addedNodes.length > 1) {
                const fuelPromise = Array.from(mutation.addedNodes)
                    .filter(x => x.nodeName === "H4")
                    .map(x => x.innerHTML.match(/(?<=openPop\(').*?(?='\))/)[0])
                    .map(x => processStationDetail(document, x));
                await Promise.all(fuelPromise);
            }
        }
        observer.observe(target, option);
    }

    //ターゲット要素をDOMで取得
    const target = document.getElementById("timetableHtmlTag");
    if (!target) return;

    //インスタンス化
    const obs = new MutationObserver(callback);
    //ターゲット要素の監視を開始
    obs.observe(target, option);

})();