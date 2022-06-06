// ==UserScript==
// @name        Add Spam Cleaner links to user list
// @description Add direct links to the spam cleaner in the XenForo's user admin panel.
// @version     1
// @include     https://www.valinor.com.br/forum/admin.php?users/list*
// @grant       none
// ==/UserScript==


/*

<td class="dataList-cell dataList-cell--link dataList-cell--main">
 <a href="/forum/admin.php?users/soikeobong88live.118313/edit">
  <div class="dataList-mainRow">
   <span class="username " dir="auto" data-user-id="118313">soikeobong88live</span>
   <span class="dataList-hint" dir="auto">soikeobong88live@gmail.com</span>
  </div>
 </a>
</td>

https://www.valinor.com.br/forum/spam-cleaner/soikeobong88live.118313/?no_redirect=1

*/


(function() {
    "use strict"

    function addLinks() {
        let parts = document.location.toString().split("/admin");
        if (parts.length < 2) {
            return;
        }

        let prefix = parts[0];
        let rx = new RegExp('.+/admin\\.php\\?users/.+\\.[0-9]+/edit');

        console.log("Adding Spam Cleaner links");
       
        let links = document.getElementsByTagName("a");
        for (var i = 0; i < links.length; i++) {
            if (rx.test(links[i].href)) {

                // <span class="username " dir="auto" data-user-id="118313">soikeobong88live</span>
                // <span class="dataList-hint" dir="auto">soikeobong88live@gmail.com</span>
                let spans = links[i].getElementsByTagName("span");
                var userid = 0;
                var target = null;
                for (var j = 0; j < spans.length; j++) {
                    var tmp;
                    if (tmp = parseInt(spans[j].getAttribute("data-user-id"))) {
                        userid = tmp;
                    }
                    if (spans[j].classList.contains("dataList-hint")) {
                        target = spans[j];
                    }
                }

                if (userid > 0 && target != null) {
                    var a = document.createElement("a");
                    a.href = prefix + "/spam-cleaner/xx." + userid + "/?no_redirect=1";
                    a.innerText = "[spam clean]";
                    target.appendChild(document.createTextNode(" "));
                    target.appendChild(a);
                    console.log(a.href);
                }
            }
        }
    }

    if (document.location.toString().indexOf("/admin.php?users/list") > 0) {
        window.addEventListener('load', addLinks, true);
    }

})();