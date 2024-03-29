// initially intended to use plain mongo node driver, mongoose is a bit heavy for this kind of an
// application. Ended up being unable to get the query string to work and started depending on mongoose
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const search = require("./search");
const schema = require("./schema");

const port = process.env.PORT;
const app = express();
app.use(bodyParser.json());

// not sure how to stub this out for testing, but there should be a way. (there was an extra library for it)
mongoose.connect(process.env.DB_URL, {useNewUrlParser: true});
const db = mongoose.connection;
// handling db connection errors
db.on('error', (err) => { console.log(`connection error: ${err}`); });
db.once('open', () => { console.log("connected to db"); });

const Record = mongoose.model('Record', schema);

/**
 * POST /filter/
 * takes json object. @see search , the data param
 * returns json object of shape {code: Number, msg: String, records: ?List}
 * code is Non-zero on error, records is only defined if error == 0
 * in case of error, the return code is 500
 */
app.post('/filter', (req, res) => {
    search(Record, req.body, (err, docs) => {
        if(err) {
            // maybe do better logging later on?
            console.log(`query error: ${err}`);
            res.stat
            res.send({
                code: 1,
                // let's not expose our internal errors to the outside world
                msg: "error fetching data"
            });
        } else {
            res.send({
                code: 0,
                msg: 'Success',
                records: docs
            });
        }
    });
});

app.listen(port, () => console.log(`Listening on port ${port}!`))
