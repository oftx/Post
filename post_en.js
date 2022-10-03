mc.listen("onServerStarted", () => {
    let postCmd = mc.newCommand("post", "§rPost function",PermType.Any);
    postCmd.overload([])
    postCmd.setCallback((cmd,origin,output,results) => {
        switch (origin.type) {
            case 0:
                main(origin.player);
        }
    });
    postCmd.setup();
});

const jsonPath = "plugins/post/post.json";
const month_en = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const line = "\n§7__________________________§r\n"
const mainFormButtons = [
    ["New post >",0,newPost,"textures/ui/icon_book_writable"],
    ["All posts >",0,allPost,"textures/ui/feedIcon"],
    ["My posts >",0,myPost,"textures/ui/mute_off"],
    ["Edit draft >",0,editDraft,"textures/ui/editIcon"],
    ["Find posts by ID >",1,requireById,"textures/ui/spyglass_flat"],
    ["Manage reported posts >",1,reportMng,"textures/ui/hammer_l"],
    ["Settings >",1,postSettings,"textures/ui/dev_glyph_color"]
];

if (!File.exists(jsonPath)) {
    let defaultJson = '{"postConfig":{"name":"Server","textLimit":100,"titleLimit":35,"postsPerPage":10,"enableCaptcha":false},"posts":[],"draft":[],"report":[]}';
    const postFile = new JsonConfigFile(jsonPath, defaultJson);
}

function main(pl){
    let mainForm = mc.newSimpleForm();
    let isOP = pl.isOP();
    let content = "";
    mainForm.setTitle("Posts");
    mainForm.setContent(content);
    for (let i=0;i < mainFormButtons.length;i++) {
        let label = mainFormButtons[i][0];
        if (mainFormButtons[i][1] == 0) {
            mainForm.addButton(label, mainFormButtons[i][3]);
        } else if (isOP) {
            mainForm.addButton(label, mainFormButtons[i][3]);
        }
    }
    pl.sendForm(mainForm, (pl, id) => {
        if (id != null) {
            switch (id) {
                case id:
                    mainFormButtons[id][2](pl);
            }
        }
    });
}

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
    for (let i=postFile.get("posts").length-1; i>=0; i--) {
        if (postFile.get("posts")[i]["visible"]) {
            postCount++;
            allId.push(String(i));
        }
    }
    if (postCount == 0) {
        let noPostForm = mc.newSimpleForm();
        noPostForm.setTitle("All posts");
        noPostForm.setContent("No post found");
        noPostForm.addButton("Create a new post >","textures/ui/mute_off");
        noPostForm.addButton("< Back","textures/ui/undoArrow");
        pl.sendForm(noPostForm, (pl, id) => {
            if (id != null) {
                switch (id) {
                    case 0:
                        newPost(pl,null,null,"Edit first post here.",null,0,1);
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
    if (page > pages.length) {
        allPost(pl,page-1);
        return;
    }
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
        let time = postFile.get("posts")[id]["time"];
        let like = postFile.get("posts")[id]["likedPlayer"].length;
        let postComment = postFile.get("posts")[id]["comment"];
        idArr.push("#" + String(id) + " §r(" + title + "§r)");
        allPostText = `${allPostText}${line}\n§l${title}§r\n${text}\n\n§7Info:\n[${playerName}] [${system}] [#${id}]\n[${time}]\n[LIKE ${like}]  [COMMENT ${postComment.length}]§r`
        allPostForm.addLabel(allPostText);
        let postId = parseInt(allId[postsPerPage * (page - 1) + i]);
        let likeStatus = false;
        if (posts[postId]["likedPlayer"].indexOf(pl.realName) != -1) likeStatus = true;
        allPostForm.addSwitch("LIKE", likeStatus);    // id: 1 3 5 ...
        allPostText = "";
        likeControlList.push(controlCount+1);
        controlCount = controlCount + 2;
    }
    allPostForm.addStepSlider(`${line}\n\n< Page ${page} of ${pageCount} >\nJump to page`, pages, page - 1);    // controlCount
    allPostForm.addLabel("\n< Operation >\n");    // controlCount + 1
    allPostForm.addStepSlider("Selected operation", ["None","View post details","Comment","Report","New post"]);    // controlCount + 2
    allPostForm.addStepSlider("Selected post", idArr);    // controlCount + 3
    pl.sendForm(allPostForm, (pl, data) => {
        if (data != null) {
            const postFile = new JsonConfigFile(jsonPath);
            let posts = postFile.get("posts");
            for (let i=0; i < postCountOnCtPage; i++) {
                let postId = parseInt(allId[postsPerPage * (page - 1) + i]);
                let likeStatus = data[likeControlList[i]];
                let playerName = pl.realName;
                let isLiking = false;
                if (posts[postId]["likedPlayer"].indexOf(playerName) != -1) isLiking = true;
                if (likeStatus == isLiking) {
                    continue;
                } else {
                    if (isLiking) {
                        let indexOfPlayer = posts[postId]["likedPlayer"].indexOf(playerName);
                        posts[postId]["likedPlayer"] = [...posts[postId]["likedPlayer"].slice(0,indexOfPlayer), ...posts[postId]["likedPlayer"].slice(indexOfPlayer+1,posts[postId]["likedPlayer"].length)];
                    } else {
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
        noPostForm.setTitle("My post");
        noPostForm.setContent("Didn't find any of your posts");
        noPostForm.addButton("New post >","textures/ui/mute_off");
        noPostForm.addButton("< Back","textures/ui/undoArrow");
        pl.sendForm(noPostForm, (pl, id) => {
            if (id != null) {
                switch (id) {
                    case 0:
                        newPost(pl,null,null,"Edit your first post",null,1,1);
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
    myPostForm.setTitle(`My post`);
    for (let i=0; i < postCountOnCtPage; i++) {
        let id = parseInt(allId[postsPerPage * (page - 1) + i]);
        let title = postFile.get("posts")[id]["title"];
        let text = postFile.get("posts")[id]["text"];
        let playerName = postFile.get("posts")[id]["playerName"];
        let system = postFile.get("posts")[id]["device"];
        let time = postFile.get("posts")[id]["time"];
        let like = postFile.get("posts")[id]["likedPlayer"].length;
        let postComment = postFile.get("posts")[id]["comment"];
        idArr.push("#" + String(id) + " §r(" + title + "§r)");
        myPostText = `${myPostText}${line}\n§l${title}§r\n${text}\n\n§7Info:\n[${system}] [#${id}]\n[${time}]\n[LIKE ${like}]  [COMMENT ${postComment.length}]§r`
        myPostForm.addLabel(myPostText);
        let postId = parseInt(allId[postsPerPage * (page - 1) + i]);
        let likeStatus = false;
        if (posts[postId]["likedPlayer"].indexOf(pl.realName) != -1) likeStatus = true;
        myPostForm.addSwitch("LIKE", likeStatus);    // id: 1 3 5 ...
        likeControlList.push(controlCount+1);
        controlCount = controlCount + 2;
        myPostText = "";
    }
    myPostForm.addStepSlider(`${line}\n\n< Page ${page} of ${pageCount} >\nJump to page number`, pages, page - 1);    // controlCount
    myPostForm.addLabel("\n< Operation >\n");    // controlCount + 1
    myPostForm.addStepSlider("Selected operation", ["None","View post details","Comment","Delete","New post"]);    // controlCount + 2
    myPostForm.addStepSlider("Selected post", idArr);    // controlCount + 3
    pl.sendForm(myPostForm, (pl, data) => {
        if (data != null) {
            const postFile = new JsonConfigFile(jsonPath);
            let posts = postFile.get("posts");
            for (let i=0; i < postCountOnCtPage; i++) {
                let postId = parseInt(allId[postsPerPage * (page - 1) + i]);
                let likeStatus = data[likeControlList[i]];
                let playerName = pl.realName;
                let isLiking = false;
                if (posts[postId]["likedPlayer"].indexOf(playerName) != -1) isLiking = true;
                if (likeStatus == isLiking) {
                    continue;
                } else {
                    if (isLiking) {
                        let indexOfPlayer = posts[postId]["likedPlayer"].indexOf(playerName);
                        posts[postId]["likedPlayer"] = [...posts[postId]["likedPlayer"].slice(0,indexOfPlayer), ...posts[postId]["likedPlayer"].slice(indexOfPlayer+1,posts[postId]["likedPlayer"].length)];
                    } else {
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

function newPost(pl,title,text,content,draftId,formId,page) {    // 3
    const postFile = new JsonConfigFile(jsonPath);
    let newPostForm = mc.newCustomForm();
    let option = ["Release","Save draft"];
    if (draftId != null) option = ["Release","Save draft","§cDelete draft"];
    if (title == null) title = "";
    if (text == null) text = "";
    if (content == null) content = "";
    newPostForm.setTitle("New post");
    newPostForm.addInput("Title","Input title here",title);
    newPostForm.addInput("Text","Input text here",text);
    newPostForm.addLabel(content);
    newPostForm.addStepSlider("Operation", option);
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
                    content = "Failed to save: draft has no content.";
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
                    let content = `Failed to publish: Character limit exceeded.\nTitle characters ===> ${title.length}/${limit1}\nBody characters ===> ${text.length}/${limit2}`;
                    newPost(pl,title,text,content,draftId,formId,page);
                    return;
                } else if (title.length == 0 || text.length == 0) {
                    let content = `Failed to publish: title and text cannot be left blank.`;
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

function editDraft(pl) { // formId == 2
    const postFile = new JsonConfigFile(jsonPath);
    let draftForm = mc.newSimpleForm();
    let noDraftForm = mc.newSimpleForm();
    let draftIdList = [];
    let buttonText = "";
    let title = "";
    let text = "";
    draftForm.setTitle("Edit draft");
    draftForm.addButton("< Back","textures/ui/undoArrow");
    for (let i=postFile.get("draft").length-1; i>=0; i--) {
        if (postFile.get("draft")[i]["playerXuid"] == pl.xuid && postFile.get("draft")[i]["visible"] == true) {
            draftIdList.push(String(i));
            if (postFile.get("draft")[i]["title"] != "") {
                buttonText = postFile.get("draft")[i]["title"];
            } else {
                buttonText = `[Untitled draft #${i}]`
            }
            draftForm.addButton(buttonText);
        }
    }
    draftForm.setContent(`${draftIdList.length} draft(s)`);
    if (draftIdList.length == 0) {
        let noDraftForm = mc.newSimpleForm();
        noDraftForm.setTitle("Edit draft");
        noDraftForm.setContent("Didn't find any of your drafts.");
        noDraftForm.addButton("New post >","textures/ui/mute_off");
        noDraftForm.addButton("< Back","textures/ui/undoArrow");
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

function reportMng(pl) {
    const postFile = new JsonConfigFile(jsonPath);
    let reportedPost = postFile.get("report");
    let reportMngForm = mc.newSimpleForm();
    reportMngForm.setTitle("Reported post");
    reportMngForm.addButton("< Back","textures/ui/undoArrow");
    if (reportedPost.length == 0) reportMngForm.setContent("Empty");
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
    let time = postFile.get("posts")[postId]["time"];
    let like = postFile.get("posts")[postId]["likedPlayer"].length;
    let postComment = postFile.get("posts")[postId]["comment"];
    label = `§l${title}§r\n${text}\n\n§7Info:\n[${playerName}] [${system}] [#${postId}]\n[${time}]\n[LIKE ${like}]  [COMMENT ${postComment.length}]§r`
    if (like != 0) {
        label = label + "\n\n§4❤§r " + postFile.get("posts")[postId]["likedPlayer"][0];
        for (let i=1; i<like; i++) {
            label = label + ", " + postFile.get("posts")[postId]["likedPlayer"][i];
        }
    }
    let whistleblowerCnt = postFile.get("report")[reportId]["whistleblower"].length;
    label = label + "\n\n\n>> " + String(whistleblowerCnt) + " report(s) in total <<\n";
    for (let i=whistleblowerCnt-1; i>=0; i--) {
        let whistleblower = postFile.get("report")[reportId]["whistleblower"][i];
        let time = postFile.get("report")[reportId]["time"][i];
        let remark = postFile.get("report")[reportId]["remark"][i];
        label = `${label}\nWhistleblower: ${whistleblower}\nTime: ${time}\nRemark: ${remark}\n`;
    }
    reportDetailsForm.setTitle(`[#${postId}] Handling of reports`);
    reportDetailsForm.setContent(label);
    reportDetailsForm.addButton(`Visible: ${postFile.get("posts")[postId]["visible"]}`);
    reportDetailsForm.addButton(`Handled: ${postFile.get("report")[reportId]["isProcessed"]}`);
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
    settingsForm.setTitle("Settings");
    settingsForm.addInput("Name", name, name);
    settingsForm.addSlider("Title text character limit",1,100,1,titleLimit);
    settingsForm.addSlider("Body text word limit",1,100,1,textLimit);
    settingsForm.addSlider("Display number of posts per page",1,100,1,postsPerPage);
    settingsForm.addSwitch("Enable CAPTCHA for posting",enableCaptcha)
    pl.sendForm(settingsForm, (pl, data) => {
        if (data != null) {
            for (let i = 0; i<configArray.length; i++) {
                if (configArray[i] != data[i]) {
                    postConfig[configArray2[i]] = data[i];
                }
            }
            postFile.set("postConfig", postConfig);
            pl.tell("Configuration saved");
        }
    });
}

function confirm(pl,title,text,draftId,formId,page) {
    const postFile = new JsonConfigFile(jsonPath);
    let confirmForm = mc.newSimpleForm();
    let content = "§l" + title + "§r\n\n" + text;
    confirmForm.setContent(content);
    confirmForm.addButton("Confirm release","textures/ui/send_icon");
    confirmForm.addButton("< Back to edit","textures/ui/undoArrow");
    pl.sendForm(confirmForm, (pl, id) => {
        if (id == 0) {
            if (postFile.get("postConfig")["enableCaptcha"]) {
                captcha(pl,"Posting after verification",title,text,draftId,formId,page);
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
            newPost(pl,title,text,null,draftId,formId);
        }
    });
}

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
    label = `§l${title}§r\n${text}\n\n§7Info:\n[${playerName}] [${system}] [#${id}]\n[${time}]\n[LIKE ${like}]  [COMMENT ${postComment.length}]§r`
    if (like != 0) {
        label = label + "\n\n§4❤§r " + postFile.get("posts")[id]["likedPlayer"][0];
        for (let i=1; i<like; i++) {
            label = label + ", " + postFile.get("posts")[id]["likedPlayer"][i];
        }
    }
    if (postComment.length != 0) {
        label = label + `\n${line}\n<§lComment§r>\n`;
        for (let i=0; i<postComment.length; i++) {
            label = label + `\n§7[#${postComment[i].id}]§r\n[${postComment[i].playerName}]\n${postComment[i].text}\n`;
        }
    }
    postDetailsForm.setTitle("Post details");
    postDetailsForm.setContent(label);
    postDetailsForm.addButton("Comment","textures/ui/comment");
    postDetailsForm.addButton("Report the post","textures/ui/hammer_l");
    if (pl.xuid == postFile.get("posts")[postId]["playerXuid"] || pl.isOP()) postDetailsForm.addButton("§cDelete this post","textures/ui/redX1");
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

function comment(pl, postId, page, formId, isPostDetail, text) {
    const postFile = new JsonConfigFile(jsonPath);
    let commentForm = mc.newCustomForm();
    if (text == null) text = "Enter a comment";
    if (isPostDetail == null) isPostDetail = false;
    commentForm.setTitle("Comment");
    commentForm.addInput(`Comment on this post §7(${postFile.get("posts")[postId]["title"]})`, text);
    pl.sendForm(commentForm, (pl, data) => {
        if (data == null) {
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
                comment(pl, postId, page, formId, isPostDetail, "Uh...you don't seem to write anything.")
            } else {
                const postFile = new JsonConfigFile(jsonPath);
                let posts = postFile.get("posts");
                let dv = pl.getDevice();
                var now = new Date();
                var year = now.getFullYear();
                var month = now.getMonth();
                var monthStr = month_en[month];
                var date = now.getDate();
                var hour= now.getHours();
                var minute= now.getMinutes();
                var second= now.getSeconds();
                let hour0 = String(hour);
                let minute0 = String(minute);
                let second0 = String(second);
                if (hour >= 0 && hour <= 9) hour0 = "0" + String(hour);
                if (minute >= 0 && minute <= 9) minute0 = "0" + String(minute);
                if (second >= 0 && second <= 9) second0 = "0" + String(second);
                let timeStr = `${monthStr} ${date}, ${year}  ${hour0}:${minute0}:${second0}`;   // 2
                posts[postId]["comment"][posts[postId]["comment"].length] = {
                    "id": posts[postId]["comment"].length,
                    "text": data[0],
                    "playerName": pl.realName,
                    "playerXuid": pl.xuid,
                    "device": dv.os,
                    "time": timeStr,
                    "likedPlayer": [],
                    "visible": true,
                    "report": false
                };
                postFile.set("posts", posts);
                pl.tell(`Comment posted successfully.§7[#${posts[postId]["comment"].length}]`);
                postDetails(pl, postId, page, formId);
            }
        }
    });
}

function captcha(pl,label,title,text,draftId,formId,page) {
    if (label == null) label = "";
    let code = Math.floor(Math.random()*21);
    let captchaForm = mc.newCustomForm();
    captchaForm.setTitle("Human verification");
    captchaForm.addLabel(`${label}\nSlide the slider to the corresponding number to pass the verification. \nVerification code:${code}`);
    captchaForm.addStepSlider("Your verification code",["0","1","2","3",'4','5',"6",'7',"8",'9',`10`,`11`,'12','13',"14",`15`,'16',`17`,"18","19","20"]);
    pl.sendForm(captchaForm, (pl,data) => {
        if (data == null) {
            newPost(pl,title,text,null,draftId,formId,page);
            return false;
        } else if (data[1] != code) {
            label = "Verification failed, please try again\n";
            captcha(pl,label,title,text,draftId,formId,page);
        } else {
            sendPost(pl, title, text, draftId);
            return true;
        }
    });
}

function sendPost(pl,title,text,draftId) {
    const postFile = new JsonConfigFile(jsonPath);
    let posts = postFile.get("posts");
    let dv = pl.getDevice();
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var monthStr = month_en[month];
    var date = now.getDate();
    // var day = now.getDay();
    var hour= now.getHours();
    var minute= now.getMinutes();
    var second= now.getSeconds();
    let hour0 = String(hour);
    let minute0 = String(minute);
    let second0 = String(second);
    if (hour >= 0 && hour <= 9) {
        hour0 = "0" + String(hour);
    }
    if (minute >= 0 && minute <= 9) {
        minute0 = "0" + String(minute);
    }
    if (second >= 0 && second <= 9) {
        second0 = "0" + String(second);
    }
    let timeStr = `${monthStr} ${date}, ${year}  ${hour0}:${minute0}:${second0}`; 
    let thisPost = {
        "id": posts.length,
        "title": title,
        "text": text,
        "playerName": pl.realName,
        "playerXuid": pl.xuid,
        "device": dv.os,
        "time": timeStr,
        "likedPlayer": [],
        "visible": true,
        "report": false,
        "comment": []
    };
    posts[posts.length] = thisPost;
    postFile.set("posts", posts);
    pl.tell(`Post published.§7[#${posts.length-1}]`);
    allPost(pl);
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
    reportForm.setTitle("Report post");
    reportForm.addInput(`Report this post (${postFile.get("posts")[postId]["title"]})\n\nReason for reporting`, "(optional)");
    pl.sendForm(reportForm, (pl, data) => {
        if (data != null) {
            const postFile = new JsonConfigFile(jsonPath);
            let reportedPost = postFile.get("report");
            let reportId = reportedPost.length;
            var now = new Date();
            var year = now.getFullYear();
            var month = now.getMonth();
            var monthStr = month_en[month];
            var date = now.getDate();
            var hour= now.getHours();
            var minute= now.getMinutes();
            var second= now.getSeconds();
            let hour0 = String(hour);
            let minute0 = String(minute);
            let second0 = String(second);
            if (hour >= 0 && hour <= 9) hour0 = "0" + String(hour);
            if (minute >= 0 && minute <= 9) minute0 = "0" + String(minute);
            if (second >= 0 && second <= 9) second0 = "0" + String(second);
            let timeStr = `${monthStr} ${date}, ${year}  ${hour0}:${minute0}:${second0}`; 
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
                    "time":[timeStr],
                    "remark":[data[0]],
                    "isProcessed": false
                };
                reportedPost[reportedPost.length] = thisReport;
            }
            postFile.set("report", reportedPost);
            pl.tell(`Report submitted to operator.§7[#${postId}]`);
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
    let content = `Are you sure you want to delete "${title}"?`;
    deleteConfirmForm.setTitle(`Delete post?`);
    deleteConfirmForm.setContent(content);
    deleteConfirmForm.addButton("§cDelete","textures/ui/redX1");
    deleteConfirmForm.addButton("Cancel","textures/ui/undoArrow");
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
                    pl.tell(`Post deleted.§7[#${postId}]`);
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
        title = "§7(Untitled)§r";
        emptyTitle = true;
    }
    if (text == "") {
        text = "§7(No content)§r";
        emptyText = true;
    }
    let draftDeleteConfirmForm = mc.newSimpleForm();
    draftDeleteConfirmForm.setTitle("Delete draft");
    draftDeleteConfirmForm.setContent(`Are you sure you want to delete this draft? \n\nTitle: ${title}\nText: ${text}`);
    draftDeleteConfirmForm.addButton("§cDelete","textures/ui/redX1");
    draftDeleteConfirmForm.addButton("Back","textures/ui/undoArrow");
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
                    pl.tell(`Draft deleted.§7[#${draftId}]`);
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
    let label = `Enter post ID`;
    if (postFile.get("posts").length > 0) label = `${label} [0,${postFile.get("posts").length - 1}]`; 
    requireByIdForm.setTitle("Find posts by ID");
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
                    pl.tell("This post does not exist.");
                    requireById(pl);
                    return;
                }
                let postId = Number(data[0]);
                postAllInfo(pl, postId);
            } else {
                pl.tell("Invalid.");
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
    if (likedPlayerLength != 0) {
        likedPlayerStr = `§4❤§r ${thisPost["likedPlayer"]}`
    }
    txt = `Title: ${thisPost.title}\nText: ${thisPost.text}\n\nPlayer: ${thisPost.playerName}\nXUID: ${thisPost.playerXuid}\n\nSystem: ${thisPost.device}\nTime: ${thisPost.time}\n\n${likedPlayerStr}`
    for (let i=0; i<report.length; i++) {
        if (report[i]["postId"] == postId) {
            isReported = true;
            reportId = i;
            reportStr = "Report information:\n";
            break;
        }
    }
    if (isReported) {
        txt = `${txt}\n\n\n>> ${report[reportId]["whistleblower"].length} report(s) <<\n`
        for (let i=0; i<report[reportId]["whistleblower"].length; i++) {
            let whistleblower = report[reportId]["whistleblower"][i];
            let time = report[reportId]["time"][i];
            let remark = report[reportId]["remark"][i];
            txt = `${txt}\nWhistleblower: ${whistleblower}\nTime: ${time}\nRemark: ${remark}\n`;
        }
    }
    postAllInfoForm.setTitle(`The details of #${postId}`);
    postAllInfoForm.setContent(txt);
    postAllInfoForm.addButton(`Visible: ${thisPost["visible"]}`);
    postAllInfoForm.addButton(`< Back`,"textures/ui/undoArrow");
    
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
    whatToDoNextForm.setTitle("What's next");
    whatToDoNextForm.setContent("The post has been saved to drafts, next you want to...");
    whatToDoNextForm.addButton("Exit","textures/ui/undoArrow");
    whatToDoNextForm.addButton("View draft");
    if (page != null) whatToDoNextForm.addButton("Continue browsing");
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