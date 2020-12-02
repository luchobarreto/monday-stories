const createHistory = require("history").createBrowserHistory;

export function redirectTo(url:string){
        let history = createHistory();
        history.push(url);
        let pathUrl = window.location.href;
        window.location.href = pathUrl;
}
