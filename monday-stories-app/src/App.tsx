import React from 'react';
import { BrowserRouter as Router, Route, Redirect } from "react-router-dom";

import 'bootstrap/dist/css/bootstrap.min.css';
import "./global.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

const App:React.FC = () => {
    return (
        <Router>
            <Route exact path="/" render={() => <Redirect to="/login" />} />
            <Route path="/login" exact component={Login} />
            <Route path="/register" exact component={Register} />
            <Route path="/dashboard" exact component={Dashboard} />
            <Route path="/a" exaxt render={() => <p>a</p>} />
        </Router>
    );
}

export default App;
