// 常量定义
const jsonPath = "plugins/post/post.json";
const langFilePath = "plugins/post/lang/zh_CN.json";
const LANG_CONFIG_DIR = "plugins/post/lang/";
const PERCENT_SIGN = "%";
const langFile = new JsonConfigFile(langFilePath);
const jsonStr = langFile.read();
var LANG = JSON.parse(jsonStr);
const line = LANG.LINE;

// 命令注册
mc.listen("onServerStarted", () => {
    let postCmd = mc.newCommand("post", LANG.TITLE_MAIN_FORM, PermType.Any);
    postCmd.overload([])
    postCmd.setCallback((cmd,origin,output,results) => {
        switch (origin.type) {
            case 0:
                main(origin.player);
        }
    });
    postCmd.setup();
});

// 初次运行写入配置文件
if (!File.exists(jsonPath)) {
    let defaultJson = '{"postConfig":{"name":"Server","textLimit":100,"titleLimit":35,"postsPerPage":10,"enableCaptcha":false},"posts":[],"draft":[],"report":[]}';
    const postFile = new JsonConfigFile(jsonPath, defaultJson);
}

// 主窗体
function main(pl){
    LANG = loadLangFile(pl);
    const mainFormButtons = [
        //按钮Label 是否需要op 跳转到功能
        [LANG.BUTTON_NEWPOST_FORM,0,newPost,"textures/ui/icon_book_writable"],
        [LANG.BUTTON_ALLPOST_FORM,0,allPost,"textures/ui/feedIcon"],
        [LANG.BUTTON_MYPOST_FORM,0,myPost,"textures/ui/mute_off"],
        [LANG.BUTTON_EDITDRAFT_FORM,0,editDraft,"textures/ui/editIcon"],
        [LANG.BUTTON_REQUIREBYID_FORM,1,requireById,"textures/ui/spyglass_flat"],
        [LANG.BUTTON_REPORTMNG_FORM,1,reportMng,"textures/ui/hammer_l"],
        [LANG.BUTTON_POSTSETTINGS_FORM,1,postSettings,"textures/ui/dev_glyph_color"],
        [LANG.BUTTON_LANGUAGE,0,languageSetting,"textures/ui/language_glyph"]
    ];
    let mainForm = mc.newSimpleForm();
    let isOP = pl.isOP();
    let content = "";
    let tmpArr = [];
    mainForm.setTitle(LANG.TITLE_MAIN_FORM);
    mainForm.setContent(content);
    for (let i=0;i < mainFormButtons.length;i++) {
        let label = mainFormButtons[i][0];
        if (mainFormButtons[i][1] == 0) {
            mainForm.addButton(label, mainFormButtons[i][3]);
            tmpArr.push(i);
        } else if (isOP) {
            mainForm.addButton(label, mainFormButtons[i][3]);
            tmpArr.push(i);
        }
    }
    pl.sendForm(mainForm, (pl, id) => {
        if (id != null) {
            switch (id) {
                case id:
                    LANG = loadLangFile(pl);
                    mainFormButtons[tmpArr[id]][2](pl);
            }
        }
    });
}

// 所有帖子 窗体
function allPost(pl, page) {
    const postFile = new JsonConfigFile(jsonPath);
    let posts = postFile.get("posts");
    let allPostForm = mc.newCustomForm();
    let postsPerPage = postFile.get("postConfig")["postsPerPage"];
    let postCountOnCtPage = postsPerPage;
    let serverName = postFile.get("postConfig")["name"];
    let controlCount = 0;
    let likeControlList = [];
    if (page == null) page = 1;
    let postCount = 0;
    let pages = [];
    let pageCount = 0;
    let allId = [];
    let idArr = [];
    let allPostText = "";
    // 记录显示的帖子总数
    for (let i=postFile.get("posts").length-1; i>=0; i--) {
        if (postFile.get("posts")[i]["visible"]) {
            postCount++;
            allId.push(String(i));
        }
    }
    if (postCount == 0) {
        let noPostForm = mc.newSimpleForm();
        noPostForm.setTitle(serverName);
        noPostForm.setContent(LANG.CONTENT_ALLPOST_NOT_FOUND);
        noPostForm.addButton(LANG.BUTTON_NEWPOST,"textures/ui/mute_off");
        noPostForm.addButton(LANG.BUTTON_BACK,"textures/ui/undoArrow");
        pl.sendForm(noPostForm, (pl, id) => {
            if (id != null) {
                switch (id) {
                    case 0:
                        newPost(pl,null,null,LANG.CONTENT_ALLPOST_EDIT_FIRST_POST,null,0,1);
                        break;
                    case 1:
                        main(pl);
                }
            }
        });
        return;
    }
    // 计算页码总数
    pageCount = Math.floor((postCount - 1) / postsPerPage) + 1;
    for (let i=1; i<=pageCount; i++) {
        pages.push(String(i));
    }
    if (page > pages.length) {    // 防只有一页时 条被拉到底
        allPost(pl,page-1);
        return;
    }
    // 当前页显示帖子总数
    if (pageCount == page) {
        postCountOnCtPage = (postCount - 1) % postsPerPage + 1;
    }
    allPostForm.setTitle(serverName);
    for (let i=0; i < postCountOnCtPage; i++) {
        let id = parseInt(allId[postsPerPage * (page - 1) + i]);
        let title = postFile.get("posts")[id]["title"];
        let text = postFile.get("posts")[id]["text"];
        let playerName = postFile.get("posts")[id]["playerName"];
        let system = postFile.get("posts")[id]["device"];
        let tmpTime = postFile.get("posts")[id]["time"];
        let like = postFile.get("posts")[id]["likedPlayer"].length;
        let postComment = postFile.get("posts")[id]["comment"];
        idArr.push("#" + String(id) + " §r(" + title + "§r)");
        let time;
        if (typeof(tmpTime) == 'string') {    // 处理 time (版本遗留)
            time = tmpTime;
        } else {
            let second, minute, hour, day;
            var date = new Date();
            var now = date.getTime();
            let difference = Math.floor((now - tmpTime) / 1000);
            if (difference < 60) {
                second = difference;
                time = String(second) + LANG.SECOND;
            } else if (difference < 3600) {
                minute = Math.floor(difference / 60);
                time = String(minute) + LANG.MINUTE;
            } else if (difference < 86400) {
                hour = Math.floor(difference / 3600);
                time = String(hour) + LANG.HOUR;
            } else {
                day = Math.floor(difference / 86400);
                time = String(day) + LANG.DAY;
            }
        }
        allPostText = tr(LANG.TEXT_ALLPOST + `§r`);
        allPostForm.addLabel(allPostText);
        // 获取是否点赞
        let postId = parseInt(allId[postsPerPage * (page - 1) + i]);
        let likeStatus = false;
        if (posts[postId]["likedPlayer"].indexOf(pl.realName) != -1) likeStatus = true;
        allPostForm.addSwitch(LANG.LIKE, likeStatus);    // id: 1 3 5 ...
        allPostText = "";
        likeControlList.push(controlCount+1);    // 控件序号
        controlCount = controlCount + 2;
    }
    allPostForm.addStepSlider(tr(LANG.TEXT_PAGE), pages, page - 1);    // controlCount
    allPostForm.addLabel("\n" + LANG.OPERATION + "\n");    // controlCount + 1
    allPostForm.addStepSlider(LANG.SELECT_OPERATION, [LANG.NONE,LANG.VIEW_POST_DETAIL,LANG.COMMENT,LANG.REPORT,LANG.NEWPOST]);    // controlCount + 2
    allPostForm.addStepSlider(LANG.SELECT_POST, idArr);    // controlCount + 3
    pl.sendForm(allPostForm, (pl, data) => {
        if (data != null) {
            const postFile = new JsonConfigFile(jsonPath);
            let posts = postFile.get("posts");
            for (let i=0; i < postCountOnCtPage; i++) {
                let postId = parseInt(allId[postsPerPage * (page - 1) + i]);
                let likeStatus = data[likeControlList[i]];    // 点赞按钮
                let playerName = pl.realName;
                let isLiking = false;    // 原来是否点赞
                if (posts[postId]["likedPlayer"].indexOf(playerName) != -1) isLiking = true;
                if (likeStatus == isLiking) {
                    continue;
                } else {
                    if (isLiking) {
                        // 原来点赞:除名
                        let indexOfPlayer = posts[postId]["likedPlayer"].indexOf(playerName);
                        posts[postId]["likedPlayer"] = [...posts[postId]["likedPlayer"].slice(0,indexOfPlayer), ...posts[postId]["likedPlayer"].slice(indexOfPlayer+1,posts[postId]["likedPlayer"].length)];
                    } else {
                        // 原来未点赞:加名
                        posts[postId]["likedPlayer"].push(playerName); 
                    }
                }
            }
            postFile.set("posts", posts);
            if (data[controlCount] + 1 != page) {
                allPost(pl, data[controlCount] + 1);
            } else {
                let postId = parseInt(allId[postsPerPage * (page - 1) + data[controlCount + 3]]);
                if (isNaN(postId) && data[controlCount + 2] != 4) {
                    allPost(pl, page);
                    return;
                }
                switch (data[controlCount + 2]) {
                    case 0:
                        allPost(pl, page);
                        break;
                    case 1:
                        postDetails(pl, postId, page, 0);
                        break;
                    case 2:
                        comment(pl, postId, page, 0);
                        break;
                    case 3:
                        report(pl, postId, 0, page, false);
                        break;
                    case 4:
                        newPost(pl,null,null,null,null,0,page);
                }
            }
        }
    });
}

// 我的帖子 窗体
function myPost(pl, page) {
    const postFile = new JsonConfigFile(jsonPath);
    let posts = postFile.get("posts");
    let myPostForm = mc.newCustomForm();
    let xuid = pl.xuid;
    let postCount = 0;
    let myPostText = "";
    let allId = [];
    let postsPerPage = postFile.get("postConfig")["postsPerPage"];
    let postCountOnCtPage = postsPerPage;
    let controlCount = 0;
    let likeControlList = [];
    if (page == null) page = 1;
    let pages = [];
    let pageCount = 0;
    let idArr = [];
    for (let i=postFile.get("posts").length-1; i>=0; i--) {
        if (postFile.get("posts")[i]["visible"] && xuid == postFile.get("posts")[i]["playerXuid"]) {
            postCount++;
            allId.push(String(i));
        }
    }
    if (postCount == 0) {
        let noPostForm = mc.newSimpleForm();
        noPostForm.setTitle(LANG.TITLE_MYPOST_FORM);
        noPostForm.setContent(LANG.CONTENT_MYPOST_NOT_FOUND);
        noPostForm.addButton(LANG.BUTTON_NEWPOST,"textures/ui/mute_off");
        noPostForm.addButton(LANG.BUTTON_BACK,"textures/ui/undoArrow");
        pl.sendForm(noPostForm, (pl, id) => {
            if (id != null) {
                switch (id) {
                    case 0:
                        newPost(pl,null,null,LANG.CONTENT_MYPOST_EDIT_FIRST_POST,null,1,1);
                        break;
                    case 1:
                        main(pl);
                }
            }
        });
        return;
    }
    pageCount = Math.floor((postCount - 1) / postsPerPage) + 1;
    for (let i=1; i<=pageCount; i++) {
        pages.push(String(i));
    }
    if (page > pageCount) {
        myPost(pl,page-1);
        return;
    }
    if (pageCount == page) {
        postCountOnCtPage = (postCount - 1) % postsPerPage + 1;
    }
    myPostForm.setTitle(LANG.TITLE_MYPOST_FORM);
    for (let i=0; i < postCountOnCtPage; i++) {
        let id = parseInt(allId[postsPerPage * (page - 1) + i]);
        let title = postFile.get("posts")[id]["title"];
        let text = postFile.get("posts")[id]["text"];
        let playerName = postFile.get("posts")[id]["playerName"];
        let system = postFile.get("posts")[id]["device"];
        let tmpTime = postFile.get("posts")[id]["time"];
        let like = postFile.get("posts")[id]["likedPlayer"].length;
        let postComment = postFile.get("posts")[id]["comment"];
        if (typeof(tmpTime) == 'string') {    // 处理 time (版本遗留)
            time = tmpTime;
        } else {
            let second, minute, hour, day;
            var date = new Date();
            var now = date.getTime();
            let difference = Math.floor((now - tmpTime) / 1000);
            if (difference < 60) {
                second = difference;
                time = String(second) + LANG.SECOND;
            } else if (difference < 3600) {
                minute = Math.floor(difference / 60);
                time = String(minute) + LANG.MINUTE;
            } else if (difference < 86400) {
                hour = Math.floor(difference / 3600);
                time = String(hour) + LANG.HOUR;
            } else {
                day = Math.floor(difference / 86400);
                time = String(day) + LANG.DAY;
            }
        }
        idArr.push("#" + String(id) + " §r(" + title + "§r)");
        myPostText = tr(LANG.TEXT_MYPOST);
        myPostForm.addLabel(myPostText);
        let postId = parseInt(allId[postsPerPage * (page - 1) + i]);
        let likeStatus = false;
        if (posts[postId]["likedPlayer"].indexOf(pl.realName) != -1) likeStatus = true;
        myPostForm.addSwitch(LANG.LIKE, likeStatus);    // id: 1 3 5 ...
        likeControlList.push(controlCount+1);
        controlCount = controlCount + 2;
        myPostText = "";
    }
    myPostForm.addStepSlider(tr(LANG.TEXT_PAGE), pages, page - 1);    // controlCount
    myPostForm.addLabel("\n" + LANG.OPERATION + "\n");    // controlCount + 1
    myPostForm.addStepSlider(LANG.SELECT_OPERATION, [LANG.NONE,LANG.VIEW_POST_DETAIL,LANG.COMMENT,LANG.DELETE,LANG.NEWPOST]);    // controlCount + 2
    myPostForm.addStepSlider(LANG.SELECT_POST, idArr);    // controlCount + 3
    pl.sendForm(myPostForm, (pl, data) => {
        if (data != null) {
            const postFile = new JsonConfigFile(jsonPath);
            let posts = postFile.get("posts");
            for (let i=0; i < postCountOnCtPage; i++) {
                let postId = parseInt(allId[postsPerPage * (page - 1) + i]);
                let likeStatus = data[likeControlList[i]];    // 点赞按钮
                let playerName = pl.realName;
                let isLiking = false;    // 原来是否点赞
                if (posts[postId]["likedPlayer"].indexOf(playerName) != -1) isLiking = true;
                if (likeStatus == isLiking) {
                    continue;
                } else {
                    if (isLiking) {
                        // 原来点赞:除名
                        let indexOfPlayer = posts[postId]["likedPlayer"].indexOf(playerName);
                        posts[postId]["likedPlayer"] = [...posts[postId]["likedPlayer"].slice(0,indexOfPlayer), ...posts[postId]["likedPlayer"].slice(indexOfPlayer+1,posts[postId]["likedPlayer"].length)];
                    } else {
                        // 原来未点赞:加名
                        posts[postId]["likedPlayer"].push(playerName); 
                    }
                }
            }
            postFile.set("posts", posts);
            if (data[controlCount] + 1 != page) {
                myPost(pl, data[controlCount] + 1);
            } else {
                let postId = parseInt(allId[postsPerPage * (page - 1) + data[controlCount + 3]]);
                if (isNaN(postId) && data[controlCount + 2] != 4) {
                    myPost(pl, page);
                    return;
                }
                switch (data[controlCount + 2]) {
                    case 1:
                        postDetails(pl, postId, page, 1);
                        break;
                    case 2:
                        comment(pl, postId, page, 1);
                        break;
                    case 3:
                        deleteConfirm(pl, postId, 1, page);
                        break;
                    case 4:
                        newPost(pl,null,null,null,null,1,page);
                }
            }
        }
    });
}

// 新建帖子 窗体
function newPost(pl,title,text,content,draftId,formId,page) {    // 3
    const postFile = new JsonConfigFile(jsonPath);
    let newPostForm = mc.newCustomForm();
    let option = [LANG.RELEASE,LANG.SAVE_DRAFT];
    if (draftId != null) option = [LANG.RELEASE,LANG.SAVE_DRAFT,"§c" + LANG.DELETE_DRAFT];
    if (title == null) title = "";
    if (text == null) text = "";
    if (content == null) content = "";
    newPostForm.setTitle(LANG.TITLE_NEWPOST_FORM);
    newPostForm.addInput(LANG.TITLE, LANG.INPUT_TITLE, title);
    newPostForm.addInput(LANG.TEXT, LANG.INPUT_TEXT, text);
    newPostForm.addLabel(content);
    newPostForm.addStepSlider(LANG.SELECT_OPERATION, option);
    pl.sendForm(newPostForm, (pl, data) => {
        if (data != null) {
            let title = data[0];
            let text = data[1];
            let operation = data[3];
            let limit1 = postFile.get("postConfig")["titleLimit"];
            let limit2 = postFile.get("postConfig")["textLimit"];
            if (operation == 1) {
                const postFile = new JsonConfigFile(jsonPath);
                if (title.length == 0 && text.length == 0) {
                    content = LANG.SAVE_FAILED_DRAFT_NO_CONTENT;
                    newPost(pl,title,text,content,draftId,formId,page);
                    return;
                }
                if (draftId != null) {
                    let draft = postFile.get("draft");
                    let thisDraft = {
                        "title": data[0],
                        "text": data[1],
                        "playerName": pl.realName,
                        "playerXuid": pl.xuid,
                        "visible": true
                    };
                    draft[draftId] = thisDraft;
                    postFile.set("draft", draft);
                } else {
                    let draft = postFile.get("draft");
                    let thisDraft = {
                        "title": data[0],
                        "text": data[1],
                        "playerName": pl.realName,
                        "playerXuid": pl.xuid,
                        "visible": true
                    };
                    draft[draft.length] = thisDraft;
                    postFile.set("draft", draft);
                }
                whatToDoNext(pl, formId, page);
            } else if (operation == 0) {
                if (title.length > limit1 || text.length > limit2) { 
                    let content = LANG.RELEASE_FAILED_EXCEEDED + "\n" + tr(RELEASE_FAILED_LIMIT);
                    newPost(pl,title,text,content,draftId,formId,page);
                    return;
                } else if (title.length == 0 || text.length == 0) {
                    let content = LANG.RELEASE_FAILED_EMPTY;
                    newPost(pl,title,text,content,draftId,formId,page);
                    return;
                }
                confirm(pl,title,text,draftId,formId,page);
            } else if (operation == 2) {
                title = data[0];
                text = data[1];
                draftDeleteConfirm(pl, draftId, title, text);
            } 
        } else {
            switch (formId) {
                case 0:
                    allPost(pl);
                    break;
                case 1:
                    myPost(pl);
                    break;
                case 2:
                    editDraft(pl);
                    break;
                case null:
                    main(pl);
            }
        }
    });
}

// 编辑草稿 窗体
function editDraft(pl) { // formId == 2
    const postFile = new JsonConfigFile(jsonPath);
    let draftForm = mc.newSimpleForm();
    let noDraftForm = mc.newSimpleForm();
    let draftIdList = [];
    let buttonText = "";
    let title = "";
    let text = "";
    draftForm.setTitle(LANG.TITLE_EDITDRAFT_FORM);
    draftForm.addButton(LANG.BUTTON_BACK,"textures/ui/undoArrow");
    for (let i=postFile.get("draft").length-1; i>=0; i--) {
        if (postFile.get("draft")[i]["playerXuid"] == pl.xuid && postFile.get("draft")[i]["visible"] == true) {
            draftIdList.push(String(i));
            if (postFile.get("draft")[i]["title"] != "") {
                buttonText = postFile.get("draft")[i]["title"];
            } else {
                buttonText = `[` + LANG.UNTITLED_DRAFT + `#${i}]`
            }
            draftForm.addButton(buttonText);
        }
    }
    draftForm.setContent(tr(LANG.CONTENT_DRAFT_COUNT));
    if (draftIdList.length == 0) {
        let noDraftForm = mc.newSimpleForm();
        noDraftForm.setTitle(LANG.TITLE_EDITDRAFT_FORM);
        noDraftForm.setContent(LANG.CONTENT_DRAFT_NOT_FOUND);
        noDraftForm.addButton(LANG.BUTTON_NEWPOST,"textures/ui/mute_off");
        noDraftForm.addButton(LANG.BUTTON_BACK,"textures/ui/undoArrow");
        pl.sendForm(noDraftForm, (pl, id) => {
            if (id != null) {
                switch (id) {
                    case 0:
                        newPost(pl,null,null,null,null,2);
                        break;
                    case 1:
                        main(pl);
                }
            }
        });
        return;
    }
    pl.sendForm(draftForm, (pl, id) => {
        if (id != null) {
            switch (id) {
                case 0:
                    main(pl);
                    break;
                case id:
                    let i = parseInt(draftIdList[id-1]);
                    newPost(pl,postFile.get("draft")[i]["title"],postFile.get("draft")[i]["text"],null,i,2);
            }
        }
    });
}

// 举报处理 窗体
function reportMng(pl) {
    const postFile = new JsonConfigFile(jsonPath);
    let reportedPost = postFile.get("report");
    let reportMngForm = mc.newSimpleForm();
    reportMngForm.setTitle(LANG.TITLE_REPORTMNG_FORM);
    reportMngForm.addButton(LANG.BUTTON_BACK,"textures/ui/undoArrow");
    if (reportedPost.length == 0) reportMngForm.setContent(LANG.EMPTY);
    for (let i=reportedPost.length-1; i>=0; i--) {
        let title = postFile.get("posts")[reportedPost[i]["postId"]]["title"];
        let postId = postFile.get("posts")[reportedPost[i]["postId"]]["id"];
        let color = "§c";
        if (postFile.get("report")[i]["isProcessed"]) color = "§a";
        reportMngForm.addButton(`§7[${color}#${postId}§7]§r${title}`);
    }
    pl.sendForm(reportMngForm, (pl, id) => {
        if (id != null) {
            switch (id) {
                case 0:
                    main(pl);
                    break;
                case id:
                    reportDetail(pl, reportedPost.length-id);
            }
        }
    });
}

function reportDetail(pl, reportId) {
    const postFile = new JsonConfigFile(jsonPath);
    postId = postFile.get("report")[reportId]["postId"];
    let reportDetailsForm = mc.newSimpleForm();
    let label = "";
    let title = postFile.get("posts")[postId]["title"];
    let text = postFile.get("posts")[postId]["text"];
    let playerName = postFile.get("posts")[postId]["playerName"];
    let system = postFile.get("posts")[postId]["device"];
    let tmpTime = postFile.get("posts")[postId]["time"];
    let like = postFile.get("posts")[postId]["likedPlayer"].length;
    let postComment = postFile.get("posts")[postId]["comment"];
    if (typeof(tmpTime) == 'string') {    // 处理 time (版本遗留)
        time = tmpTime;
    } else {
        time = new Date(tmpTime).toISOString();
    }
    label = tr(LANG.TEXT_REPORT_DETAIL) + `§r`;
    if (like != 0) {
        label = label + "\n\n§4❤§r " + postFile.get("posts")[postId]["likedPlayer"][0];
        for (let i=1; i<like; i++) {
            label = label + ", " + postFile.get("posts")[postId]["likedPlayer"][i];
        }
    }
    let whistleblowerCnt = postFile.get("report")[reportId]["whistleblower"].length;
    label = label + "\n\n\n" + tr(LANG.TEXT_REPORT_COUNT) + "\n";
    for (let i=whistleblowerCnt-1; i>=0; i--) {
        let whistleblower = postFile.get("report")[reportId]["whistleblower"][i];
        let tmpTime = postFile.get("report")[reportId]["time"][i];
        let remark = postFile.get("report")[reportId]["remark"][i];
        if (typeof(tmpTime) == 'string') {    // 处理 time (版本遗留)
            time = tmpTime;
        } else {
            time = new Date(tmpTime).toISOString();
        }
        label = tr(LANG.TEXT_WHISTLEBLOWER);
    }
    reportDetailsForm.setTitle(tr(LANG.TITLE_REPORT_DETAIL));
    reportDetailsForm.setContent(label);
    reportDetailsForm.addButton(LANG.VISIBLE + `: ${postFile.get("posts")[postId]["visible"]}`);
    reportDetailsForm.addButton(LANG.PROCESSED + `: ${postFile.get("report")[reportId]["isProcessed"]}`);
    pl.sendForm(reportDetailsForm, (pl, id) => {
        if (id == null) {
            reportMng(pl);
        } else {
            const postFile = new JsonConfigFile(jsonPath);
            switch (id) {
                case 0:
                    let tempPost = postFile.get("posts");
                    tempPost[postId]["visible"] = !tempPost[postId]["visible"];
                    postFile.set("posts", tempPost);
                    reportDetail(pl, reportId);
                    break;
                case 1:
                    let tempReport = postFile.get("report");
                    tempReport[reportId]["isProcessed"] = !tempReport[reportId]["isProcessed"];
                    postFile.set("report", tempReport);
                    reportDetail(pl, reportId);
            }
        }
    });
}

// 插件设置 窗体
function postSettings(pl) {
    const postFile = new JsonConfigFile(jsonPath);
    let postConfig = postFile.get("postConfig");
    let name = postFile.get("postConfig")["name"];
    let textLimit = postFile.get("postConfig")["textLimit"];
    let titleLimit = postFile.get("postConfig")["titleLimit"];
    let postsPerPage = postFile.get("postConfig")["postsPerPage"];
    let enableCaptcha = postFile.get("postConfig")["enableCaptcha"];
    let configArray = [name, titleLimit, textLimit, postsPerPage, enableCaptcha];
    let configArray2 = ["name", "titleLimit", "textLimit", "postsPerPage", "enableCaptcha"];
    let settingsForm = mc.newCustomForm();
    settingsForm.setTitle(LANG.TITLE_POSTSETTINGS_FORM);
    settingsForm.addInput(LANG.NAME, name, name);
    settingsForm.addSlider(LANG.TITLE_LIMIT,1,100,1,titleLimit);
    settingsForm.addSlider(LANG.TEXT_LIMIT,1,100,1,textLimit);
    settingsForm.addSlider(LANG.POST_CNT_PER_PAGE,1,100,1,postsPerPage);
    settingsForm.addSwitch(LANG.ENABLE_CAPTCHA,enableCaptcha)
    pl.sendForm(settingsForm, (pl, data) => {
        if (data != null) {
            for (let i = 0; i<configArray.length; i++) {
                if (configArray[i] != data[i]) {
                    postConfig[configArray2[i]] = data[i];
                }
            }
            postFile.set("postConfig", postConfig);
            pl.tell(LANG.CONFIG_SAVED);
        }
    });
}

// 确认
function confirm(pl,title,text,draftId,formId,page) {
    const postFile = new JsonConfigFile(jsonPath);
    let confirmForm = mc.newSimpleForm();
    let content = "§l" + title + "§r\n\n" + text;
    confirmForm.setContent(content);
    confirmForm.addButton(LANG.RELEASE_CONFIRM,"textures/ui/send_icon");
    confirmForm.addButton(LANG.BUTTON_BACK_EDIT,"textures/ui/undoArrow");
    pl.sendForm(confirmForm, (pl, id) => {
        if (id == 0) {
            //发布
            if (postFile.get("postConfig")["enableCaptcha"]) {
                captcha(pl,LANG.CAPTCHA_LABEL,title,text,draftId,formId,page);
            } else {
                if (draftId != null) {
                    const postFile = new JsonConfigFile(jsonPath);
                    draft = postFile.get("draft");
                    draft[draftId]["visible"] = false;
                    postFile.set("draft", draft);
                }
                sendPost(pl, title, text, draftId);
            }
        } else if (id == 1 || id == null) {
            //返回编辑
            newPost(pl,title,text,null,draftId,formId);
        }
    });
}

// 帖子详情 窗体
function postDetails(pl, postId, page, formId) {
    const postFile = new JsonConfigFile(jsonPath);
    let postDetailsForm = mc.newSimpleForm();
    let label = "";
    let id = postId;
    let title = postFile.get("posts")[id]["title"];
    let text = postFile.get("posts")[id]["text"];
    let playerName = postFile.get("posts")[id]["playerName"];
    let system = postFile.get("posts")[id]["device"];
    let time = postFile.get("posts")[id]["time"];
    let like = postFile.get("posts")[id]["likedPlayer"].length;
    let postComment = postFile.get("posts")[id]["comment"];
    label = tr(LANG.TEXT_POST_DETAIL) + `§r`;
    if (like != 0) {
        label = label + "\n\n§4❤§r " + postFile.get("posts")[id]["likedPlayer"][0];
        for (let i=1; i<like; i++) {
            label = label + ", " + postFile.get("posts")[id]["likedPlayer"][i];
        }
    }
    if (postComment.length != 0) {
        label = label + `\n${line}\n<§l` + LANG.COMMENT_AREA + `§r>\n`;
        for (let i=0; i<postComment.length; i++) {
            label = label + `\n§7[#${postComment[i].id}]§r\n[${postComment[i].playerName}]\n${postComment[i].text}\n`;
        }
    }
    postDetailsForm.setTitle(LANG.TITLE_POST_DETAIL);
    postDetailsForm.setContent(label);
    postDetailsForm.addButton(LANG.COMMENT,"textures/ui/comment");
    postDetailsForm.addButton(LANG.REPORT_THIS_POST,"textures/ui/hammer_l");
    if (pl.xuid == postFile.get("posts")[postId]["playerXuid"] || pl.isOP()) postDetailsForm.addButton("§c" + LANG.DALETE_POST,"textures/ui/redX1");
    pl.sendForm(postDetailsForm, (pl, id) => {
        if (id == null) {
            if (formId == 0) { 
                allPost(pl, page);
            } else if (formId == 1) {
                myPost(pl, page)
            }
        } else if (id == 0) {
            comment(pl, postId, page, formId, true);
        } else if (id == 1) {
            report(pl, postId, formId, page, true);
        } else if (id == 2) {
            deleteConfirm(pl, postId, formId, page, true);
        }
    });
}

// 评论帖子 窗体
function comment(pl, postId, page, formId, isPostDetail, text) {
    const postFile = new JsonConfigFile(jsonPath);
    let commentForm = mc.newCustomForm();
    let title = postFile.get("posts")[postId]["title"];
    if (text == null) text = LANG.COMMENT_PLACEHOLDER;
    if (isPostDetail == null) isPostDetail = false;
    commentForm.setTitle(LANG.COMMENT_POST);
    commentForm.addInput(tr(LANG.COMMENT_SPECIFIC_POST), text);
    pl.sendForm(commentForm, (pl, data) => {
        if (data == null) {    // 跳转到原先的窗口
            if (isPostDetail) {
                postDetails(pl, postId, page, formId);
            } else {
                switch (formId) {
                    case 0:
                        allPost(pl, page);
                        break;
                    case 1:
                        myPost(pl, page);
                }
            }
        } else {
            if (data[0] == "") {
                comment(pl, postId, page, formId, isPostDetail, LANG.COMMENT_INFO_EMPTY)
            } else {
                const postFile = new JsonConfigFile(jsonPath);
                let posts = postFile.get("posts");
                let dv = pl.getDevice();
                var date = new Date();
                var now = date.getTime();
                posts[postId]["comment"][posts[postId]["comment"].length] = {
                    "id": posts[postId]["comment"].length,
                    "text": data[0],
                    "playerName": pl.realName,
                    "playerXuid": pl.xuid,
                    "device": dv.os,
                    "time": now,
                    "likedPlayer": [],
                    "visible": true,
                    "report": false
                };
                postFile.set("posts", posts);
                pl.tell(LANG.COMMENT_SUCCESS + `§7[#${posts[postId]["comment"].length}]`);
                postDetails(pl, postId, page, formId);
            }
        }
    });
}

// 人机验证 窗体
function captcha(pl,label,title,text,draftId,formId,page) {
    if (label == null) label = "";
    let code = Math.floor(Math.random()*21);
    let captchaForm = mc.newCustomForm();
    captchaForm.setTitle(LANG.TITLE_CAPTCHA);
    captchaForm.addLabel(tr(LANG.TEXT_CAPTCHA));
    captchaForm.addStepSlider(LANG.CAPTCHA_CODE,["0","1","2","3",'4','5',"6",'7',"8",'9',`10`,`11`,'12','13',"14",`15`,'16',`17`,"18","19","20"]);
    pl.sendForm(captchaForm, (pl,data) => {
        if (data == null) {
            newPost(pl,title,text,null,draftId,formId,page);
            return false;
        } else if (data[1] != code) {
            label = LANG.CAPTCHA_FAILED + "\n";
            captcha(pl,label,title,text,draftId,formId,page);
        } else {
            sendPost(pl, title, text, draftId);
            return true;
        }
    });
}

// 发送
function sendPost(pl,title,text,draftId) {
    const postFile = new JsonConfigFile(jsonPath);
    let posts = postFile.get("posts");
    let dv = pl.getDevice();
    var date = new Date();
    var now = date.getTime();
    let thisPost = {
        "id": posts.length,
        "title": title,
        "text": text,
        "playerName": pl.realName,
        "playerXuid": pl.xuid,
        "device": dv.os,
        "time": now,
        "likedPlayer": [],
        "visible": true,
        "report": false,
        "comment": []
    };
    posts[posts.length] = thisPost;
    postFile.set("posts", posts);
    pl.tell(LANG.POST_RELEASE_SUCCESS + `§7[#${posts.length-1}]`);
    allPost(pl);
    // 删除草稿
    if (draftId != null) {
        const postFile = new JsonConfigFile(jsonPath);
        let draft = postFile.get("draft");
        draft[draftId]["visible"] = false;
        postFile.set("draft", draft);
    }
}

function report(pl, postId, formId, page, isPostDetail) {
    let reportForm = mc.newCustomForm();
    const postFile = new JsonConfigFile(jsonPath);
    let title = postFile.get("posts")[postId]["title"];
    reportForm.setTitle(LANG.TITLE_PEPORT_FORM);
    reportForm.addInput(tr(LANG.TEXT_REPORT), LANG.REPORT_REASON_PLACEHOLDER);
    pl.sendForm(reportForm, (pl, data) => {
        if (data != null) {
            const postFile = new JsonConfigFile(jsonPath);
            let reportedPost = postFile.get("report");
            let reportId = reportedPost.length;
            var date = new Date();
            var now = date.getTime();
            for (let i=0; i<reportedPost.length; i++) {
                if (postId == reportedPost[i]["postId"]) {
                    reportId = i;
                }
            }
            if (reportId < reportedPost.length) {
                reportedPost[reportId]["whistleblower"][reportedPost[reportId]["whistleblower"].length] = pl.realName;
                reportedPost[reportId]["time"][reportedPost[reportId]["time"].length] = timeStr;
                reportedPost[reportId]["remark"][reportedPost[reportId]["remark"].length] = data[0];
                reportedPost[reportId]["isProcessed"] = false;
            } else {
                let thisReport = {
                    "postId":postId,
                    "whistleblower":[pl.realName],
                    "time":[now],
                    "remark":[data[0]],
                    "isProcessed": false
                };
                reportedPost[reportedPost.length] = thisReport;
            }
            postFile.set("report", reportedPost);
            pl.tell(LANG.REPORT_SUCCESS + `§7[#${postId}]`);
            if (isPostDetail) {
                postDetails(pl, postId, page, formId);
            } else {
                if (formId == 0) {
                    allPost(pl, page);
                } else if (formId == 1) {
                    myPost(pl, page);
                }
            }
        } else {
            if (isPostDetail) {
                postDetails(pl, postId, page, formId);
            } else {
                if (formId == 0) {
                    allPost(pl, page);
                } else if (formId == 1) {
                    myPost(pl, page);
                }
            }
        }
    });
}

function deleteConfirm(pl, postId, formId, page, isPostDetail) {
    if (isPostDetail == null) isPostDetail = false;
    const postFile = new JsonConfigFile(jsonPath);
    let deleteConfirmForm = mc.newSimpleForm();
    if (page == null) page = 1;
    let title = postFile.get("posts")[postId]["title"];
    let content = tr(LANG.CONTENT_POST_DELETE_FORM);
    deleteConfirmForm.setTitle(LANG.TITLE_POST_DELETE_FORM);
    deleteConfirmForm.setContent(content);
    deleteConfirmForm.addButton("§c" + LANG.DELETE,"textures/ui/redX1");
    deleteConfirmForm.addButton(LANG.CANCEL,"textures/ui/undoArrow");
    pl.sendForm(deleteConfirmForm, (pl, id) => {
        if (id == null) {
            if (isPostDetail) {
                postDetails(pl, postId, page, formId);
            } else {
                if (formId == 1) {
                    myPost(pl, page);
                } else if (formId == 0) {
                    allPost(pl, page);
                }
            }
        } else {
            const postFile = new JsonConfigFile(jsonPath);
            switch (id) {
                case 0:
                    let posts = postFile.get("posts");
                    posts[postId]["visible"] = false;
                    postFile.set("posts", posts);
                    pl.tell(LANG.POST_DELETE_SUCCESS + `§7[#${postId}]`);
                    if (formId == 1) {
                        myPost(pl, 1);
                    } else if (formId == 0) {
                        allPost(pl, 1);
                    }
                    break;
                case 1:
                    if (isPostDetail) {
                        postDetails(pl, postId, page, formId);
                    } else {
                        if (formId == 1) {
                            myPost(pl, page);
                        } else if (formId == 0) {
                            allPost(pl, page);
                        }
                    }
            }
        }
    });
}

function draftDeleteConfirm(pl, draftId, title, text) {
    let emptyTitle = false;
    let emptyText = false;
    if (title == "") {
        title = "§7" + LANG.EMPTY_TITLE + "§r";
        emptyTitle = true;
    }
    if (text == "") {
        text = "§7" + LANG.EMPTY_TEXT + "§r";
        emptyText = true;
    }
    let draftDeleteConfirmForm = mc.newSimpleForm();
    draftDeleteConfirmForm.setTitle(LANG.TITLE_DELETEDRAFT_FORM);
    draftDeleteConfirmForm.setContent(tr(LANG.DRAFT_DELETE_CONFIRM));
    draftDeleteConfirmForm.addButton("§c" + LANG.DRAFT_DELETE,"textures/ui/redX1");
    draftDeleteConfirmForm.addButton(LANG.DRAFT_BACK_TO_EDIT,"textures/ui/undoArrow");
    pl.sendForm(draftDeleteConfirmForm, (pl, id) => {
        if (id == null) {
            editDraft(pl);
        } else {
            switch (id) {
                case 0:
                    const postFile = new JsonConfigFile(jsonPath);
                    let draft = postFile.get("draft");
                    draft[draftId]["visible"] = false;
                    postFile.set("draft", draft);
                    pl.tell(LANG.DRAFT_DETELE_SUCCESS + `§7[#${draftId}]`);
                    editDraft(pl);
                    break;
                case 1:
                    if (emptyTitle) title = "";
                    if (emptyText) text = "";
                    newPost(pl, title, text, null, draftId, 2);
            }
        }
    });
}

function requireById(pl) {
    const postFile = new JsonConfigFile(jsonPath);
    let requireByIdForm = mc.newCustomForm();
    let label = LANG.INPUT_POST_ID;
    if (postFile.get("posts").length > 0) label = `${label} [0,${postFile.get("posts").length - 1}]`; 
    requireByIdForm.setTitle(LANG.TITLE_REQUIREBYID_FORM);
    requireByIdForm.addInput(label);
    pl.sendForm(requireByIdForm, (pl, data) => {
        if (data != null) {
            let isNumber = true;
            for (let i=0; i<data[0].length; i++) {
                let t = data[0].slice(i,i+1);
                if (isNaN(Number(t))) {
                    isNumber = false;
                    break;
                }
            }
            if (data[0] == "") isNumber = false;
            if (isNumber == true) {
                if (Number(data[0]) >= postFile.get("posts").length) {
                    pl.tell(LANG.POST_NOT_FOUND);
                    requireById(pl);
                    return;
                }
                let postId = Number(data[0]);
                postAllInfo(pl, postId);
            } else {
                pl.tell(LANG.INPUT_INVALID);
                requireById(pl);
            }
        }
    })
}

function postAllInfo(pl, postId) {
    const postFile = new JsonConfigFile(jsonPath);
    let postAllInfoForm = mc.newSimpleForm();
    let thisPost = postFile.get("posts")[postId];
    let report = postFile.get("report");
    let txt = "";
    let likedPlayerLength = thisPost["likedPlayer"].length;
    let likedPlayerStr = "";
    let isReported = false;
    let reportId = -1;
    let reportStr = "";
    let tmpTime = thisPost.time;
    if (likedPlayerLength != 0) {
        likedPlayerStr = LANG.LIKED_PLAYER + `:${thisPost["likedPlayer"]}`
    }
    if (typeof(tmpTime) == 'string') {    // 处理 time (版本遗留)
        time = tmpTime;
    } else {
        time = new Date(tmpTime).toISOString();
    }
    txt = tr(LANG.TEXT_POST_ALL_DETAIL);
    for (let i=0; i<report.length; i++) {    // 遍历寻找举报记录
        if (report[i]["postId"] == postId) {
            isReported = true;
            reportId = i;
            reportStr = LANG.REPORT_INFO + ":\n";
            break;
        }
    }
    if (isReported) {
        let reportCnt = report[reportId]["whistleblower"].length;
        txt += "\n\n\n" + tr(LANG.REPORT_CNT) + "\n"
        for (let i=0; i<report[reportId]["whistleblower"].length; i++) {
            let whistleblower = report[reportId]["whistleblower"][i];
            let tmpTime = report[reportId]["time"][i];
            let remark = report[reportId]["remark"][i];
            if (typeof(tmpTime) == 'string') {    // 处理 time (版本遗留)
                time = tmpTime;
            } else {
                time = new Date(tmpTime).toISOString();
            }
            txt += `\n${LANG.WHISTLEBLOWER}:${whistleblower}\n${LANG.TIME}:${time}\n${LANG.REMARK}:${remark}\n`;
        }
    }
    postAllInfoForm.setTitle(tr(LANG.TITLE_POST_ALL_INFO));
    postAllInfoForm.setContent(txt);
    postAllInfoForm.addButton(LANG.VISIBLE + `: ${thisPost["visible"]}`);
    postAllInfoForm.addButton(LANG.BUTTON_BACK, "textures/ui/undoArrow");
    
    pl.sendForm(postAllInfoForm, (pl, id) => {
        if (id != null) {
            const postFile = new JsonConfigFile(jsonPath);
            switch (id) {
                case 0:
                    let tempPost = postFile.get("posts");
                    tempPost[postId]["visible"] = !tempPost[postId]["visible"];
                    postFile.set("posts", tempPost);
                    postAllInfo(pl, postId);
                    break;
                case 1:
                    requireById(pl);
            }
        }
    });
}

function whatToDoNext(pl, formId, page) {
    let whatToDoNextForm = mc.newSimpleForm();
    whatToDoNextForm.setTitle(LANG.TITLE_NEXT);
    whatToDoNextForm.setContent(LANG.CONTENT_NEXT);
    whatToDoNextForm.addButton(LANG.BUTTON_EXIT,"textures/ui/undoArrow");
    whatToDoNextForm.addButton(LANG.BUTTON_VIEW_DRAFT);
    if (page != null) whatToDoNextForm.addButton(LANG.BUTTON_CONTINUE);
    pl.sendForm(whatToDoNextForm, (pl, id) => {
        if (id != null) {
            switch (id) {
                case 1:
                    editDraft(pl);
                    break;
                case 2:
                    switch (formId) {
                        case 0:
                            allPost(pl, page);
                            break;
                        case 1:
                            myPost(pl, page);
                    }
                    break;
                case 0:
                    return;
                }
            }
        }
    );
}

function languageSetting(pl) {
    LANG = loadLangFile(pl);
    const postFile = new JsonConfigFile(jsonPath);
    let langForm = mc.newSimpleForm();
    langForm.setTitle(LANG.TITLE_LANGUAGE);
    langForm.setContent(LANG.CONTENT_LANGUAGE);
    langForm.addButton(LANG.BUTTON_BACK,"textures/ui/undoArrow");
    let allLangFile = File.getFilesList(LANG_CONFIG_DIR);
    for (let i in allLangFile) {
        let tmpLangFile = new JsonConfigFile(LANG_CONFIG_DIR + allLangFile[i]);
        let tmpLangName = tmpLangFile.get("LANGUAGE_REGION_NAME");
        if (allLangFile[i] == postFile.get("lang")[pl.realName]) tmpLangName = `§e> §r§l ${tmpLangName} §r§e <§r`
        langForm.addButton(tmpLangName);
    }
    pl.sendForm(langForm, (pl, id) => {
        if (id != null) {
            switch (id) {
                case 0:
                    main(pl);
                    break;
                case id:
                    const postFile = new JsonConfigFile(jsonPath);
                    let tempLang = postFile.get("lang");
                    tempLang[pl.realName] = allLangFile[id - 1];
                    postFile.set("lang", tempLang);
                    languageSetting(pl);
            }
        }
    });
}

function loadLangFile(pl) {
    const jsonPath = "plugins/post/post.json";
    const postFile = new JsonConfigFile(jsonPath);
    let tmpLangKey = postFile.get("lang");
    let langFileName;
    if (tmpLangKey[pl.realName] != undefined) {
        langFileName = tmpLangKey[pl.realName];
    } else {
        langFileName = "zh_CN.json";
    }
    const langFilePath = "plugins/post/lang/" + langFileName;
    const langFile = new JsonConfigFile(langFilePath);
    const jsonStr = langFile.read();
    LANG = JSON.parse(jsonStr);
    return LANG;
}

// function tr0(str) {
//     tmpStr = str;
//     for (let i = 1; i <= arguments.length - 1; i++) {
//         tmpStr = tmpStr.replace("%a", arguments[i]);
//     }
//     return tmpStr;
// }

function tr(tmpStr) {
    let str = tmpStr;
    var patt = /%.*?%/g;
    var patt1 = /%.*?%/i;
    var patt2 = /(?<=\%).+?(?=\%)/i;
    var matchedStr = str.match(patt);
    var matchedStr1, matchedStr2;
    for (let i = 0; i < matchedStr.length; i++) {
        var matchedStr1 = str.match(patt1);
        var matchedStr2 = str.match(patt2);
        str = str.replace(matchedStr1,eval(matchedStr2[0]));
    }
    return str;
}