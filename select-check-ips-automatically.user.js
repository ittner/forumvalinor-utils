// ==UserScript==
// @name     Fórum Valinor - Spam cleaner - Select "Check IPs" automatically
// @version  1
// @include	 https://www.valinor.com.br/forum/spam-cleaner/*
// @grant    none
// ==/UserScript==


(function() {
    window.addEventListener("load", function() {
        let lst = document.getElementsByName("check_ips");
        if (lst.length == 1 && lst[0].tagName == "INPUT") {
            /* Only set automatically if there is exactly one matching 
               element. Otherwise, it's ambigous. */
            lst[0].checked = true;
        }
    });
})();
