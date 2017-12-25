import Rebase from 're-base';
import firebase from 'firebase/app';
import 'firebase/database';

var app = firebase.initializeApp({
     apiKey: "AIzaSyB0kK5ShKDbkI-njs4mqaIS4PdmOKsDF5M",
    authDomain: "activehound-eec34.firebaseapp.com",
    databaseURL: "https://activehound-eec34.firebaseio.com",
    projectId: "activehound-eec34",





});



var db = firebase.database(app);
var base = Rebase.createClass(db);

export default base;