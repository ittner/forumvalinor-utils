// ==UserScript==
// @name         leitura_forum_valinor
// @namespace    http://www.ittner.com.br/misc/leitura_forum_valinor.user.js
// @description  Controle de leitura de tópicos do Fórum Valinor
// @include      http://forum.valinor.com.br/forumdisplay.php*
// @include      http://forum.valinor.com.br/showthread.php*
// ==/UserScript==


function get_storage() {
    if (unsafeWindow.localStorage)
        return unsafeWindow.localStorage;
    var dom = document.domain || ".localdomain";
    if (unsafeWindow.globalStorage)
        return unsafeWindow.globalStorage[dom];
}


function parse_url_query_args(url) {
    var args = [];
    /* aceita blerg.php?answer=42&foo=bar e answer=42&foo=bar */
    var astr = url.split("?").pop();
    if (!astr)
        return args; /* Blerg! */
    var pairs = astr.split("&");
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split("=");
        if (pair.length == 2 && pair[0] && pair[1])
            args[pair[0]] = pair[1];
    }
    return args;
}

function get_current_url_query_args() {
    return parse_url_query_args(document.location.search);
}


/* http://forum.valinor.com.br/forumdisplay.php?f=250 */
function get_current_forum_id() {
    if (document.location.pathname == "/forumdisplay.php")
        return parseInt(get_current_url_query_args().f);
    return -1;
}


/* http://forum.valinor.com.br/showthread.php?t=91067 */
function get_current_thread_id() {
    if (document.location.pathname == "/showthread.php") {
        /* Modo Fácil, o código da thread estava na URL. */
        var tid = get_current_url_query_args().t;
        if (tid)
            return parseInt(tid);

        /* Modo Difícil, sem código na URL, como acontece na exibição
         * do último post lido. Como todas as páginas têm um formulário
         * de busca com o código da thread, podemos usá-lo para isso.
         */
         var searchdiv = document.getElementById("threadsearch_menu");
         if (searchdiv) {
            var forms = searchdiv.getElementsByTagName("form");
            for (var i = 0; i < forms.length; i++) {
                if (forms[i].action) {
                    var fargs = parse_url_query_args(forms[i].action);
                    if (fargs.searchthreadid)
                        return parseInt(fargs.searchthreadid);
                }
            }
        }
        
        /* <french-mode> I give up </french-mode> */
    }
    return -1;
}


/* 
 * Procura tabelas com id="postXXXX" dentro de um número qualquer de divs.
 * A estrutura do fórum é algo parecido com:
 *   div id="posts" / div / ... / div / table id="postXXX"
 *
 */
function find_inner_post_ids(maxpost, element) {
    var innerdivs = element.getElementsByTagName("div");
    for (var i = 0; i < innerdivs.length; i++) {
        var currdiv = innerdivs[i];
        var innertables = currdiv.getElementsByTagName("table");
        for (var j = 0; j < innertables.length; j++) {
            var tbl = innertables[j];
            if (tbl.id && tbl.id.indexOf("post") == 0) {
                var num = parseInt(tbl.id.substring(4));
                if (num > maxpost)
                    maxpost = num;
            }
        }
        maxpost = find_inner_post_ids(maxpost, currdiv);
    }
    return maxpost;
}


function find_last_post_number_here() {
    var nl = document.getElementById("posts");
    if (nl)
        return find_inner_post_ids(-1, nl);
    return -2;
}




/* Procura pelo código do último post. Ele fica no destino de um link
 * no formato "showthread.php?p=2027999#post2027999", dentro de uma div,
 * dentro da coluna indicada.
 */

function find_last_post_forum_index_td(currtd) {
    var divs = currtd.getElementsByTagName("div");
    if (divs) {
        for (var i = 0; i < divs.length; i++) {
            var as = divs[i].getElementsByTagName("a");
            if (as) {
                for (var j = 0; j < as.length; j++) {
                    var a = as[j];
                    if (a.href && a.href.indexOf("showthread.php") > -1) {
                        /* Só alguns links têm um #fragment. Retira-o */
                        var parts = a.href.split("#");
                        var args = parse_url_query_args(parts[0]);
                        if (args.p) {
                            return parseInt(args.p);    /* BAZINGA!! */
                        }
                    }
                }
            }
        }
    }
    return -1;  /* Não encontrado */
}

/* Chama a função "callback_func" para cada elemento "tr" representando uma
 * linha da tabela de posts do fórum atual ("tr_element"). Os argumentos
 * passados a função são:
 *
 * callback_func(storage, forum_id, tr_element, td_icon, thread_id, last_post)
 *
 * onde "td_icon" é o elemento "td" da coluna que contém os ícones do tópico.
 * Se o callback retornar true, a iteração é interrompida.
 */

function apply_to_forum_body_rows(forum_id, callback_func) {
    var st = get_storage();

    /* A lista de tópicos fica num tbody com id=threadbits_forum_XX */
    var tbody = document.getElementById("threadbits_forum_" + forum_id);
    if (tbody) {
        /* Procura todas as linhas dessa tabela */
        var trs = tbody.getElementsByTagName("tr");
        for (var i = 0; i < trs.length; i++) {
            var currtr = trs[i];
            var thread_id = -1;
            var last_post = -1;
            var tdicon = false;
            
            /* Vasculha as colunas procurando os códigos do tópico
             * e o último post.
             */
            var tds = currtr.getElementsByTagName("td");
            for (var j = 0; j < tds.length; j++) {
                var currtd = tds[j];
                
                /* Alguns IDs de coluna têm o código de tópico. */
                if (thread_id <= 0 && currtd.id
                && (currtd.id.indexOf("td_threadtitle_") == 0
                || currtd.id.indexOf("td_threadstatusicon_") == 0)) {
                    var tokens = currtd.id.split("_");
                    thread_id = parseInt(tokens.pop());
                }
                if (last_post <= 0)
                    last_post = find_last_post_forum_index_td(currtd);

                /* Coluna que exibirá o status do tópico */
                if (currtd.id.indexOf("td_threadstatusicon_") == 0)
                    tdicon = currtd;
            }
            
            if (thread_id > 0 && last_post > 0) {
                if (callback_func(st, forum_id, currtr, tdicon, thread_id, last_post))
                    return
            }
        }
    }
}

function update_forum_body(forum_id) {
    apply_to_forum_body_rows(forum_id,
        function(st, forum_id, tr_element, tdicon, thread_id, last_post) {
            var last_read = parseInt(st["th_last_" + thread_id] || 0);
            if (tdicon && last_post > last_read) {
                tdicon.innerHTML = "Posts novos";  /* Feio, sei */
                /* Deixa o título do tópico em negrito */
                var thkey = "thread_title_" + thread_id;
                var thlink = document.getElementById(thkey);
                if (thlink)
                    thlink.style.setProperty("font-weight", "bold", null);
            }
            return false;
        });
}


function mark_forum_read() {
    apply_to_forum_body_rows(get_current_forum_id(),
        function(st, forum_id, tr_element, tdicon, thread_id, last_post) {
            var st_key = "th_last_" + thread_id;
            var last_read = parseInt(st[st_key] || 0);
            if (tdicon && last_post > last_read) {
                st[st_key] = last_post;
                tdicon.innerHTML = "Lido";  /* Feio, sei */
                var thkey = "thread_title_" + thread_id;
                var thlink = document.getElementById(thkey);
                if (thlink)
                    thlink.style.setProperty("font-weight", "normal", null);
            }
            return false;
        });
}


function process_page() {
    var thread_id = get_current_thread_id();
    if (thread_id > 0) {
        var st = get_storage();
        var key = "th_last_" + thread_id;
        var last = parseInt(st[key] || 0);
        var posts = find_last_post_number_here();
        if (posts > last)
            st[key] = posts;
    }
    var forum_id = get_current_forum_id();
    if (forum_id > 0) {
        update_forum_body(forum_id);
        if (GM_registerMenuCommand) {
            GM_registerMenuCommand("Marcar fórum como lido", mark_forum_read,
                "", "", "M");
        }
    }
}

window.addEventListener('load', process_page, true);


