/**
 * Callback for when there is (or is not) data
 * 
 * @callback dataCb
 * @param err not null if there is an error, null in case of error\]
 * @param data returned data if there is no error
 */

/**
 * Connect to the server, execute the query and fetch the results.
 * @param {mongoose.Model} model 
 * @param {Object} data query options 
 * @param {Number} data.minCount minimum total count to filter
 * @param {Number} data.maxCount maximum total count to filter
 * @param {String} data.startDate minimum date to filter. in YYYY-MM-DD format
 * @param {String} data.startDate minimum date to filter. in YYYY-MM-DD format
 * @param {dataCb} cb when the data (or an error) is retrieved
 */
const search = (model, data, cb) => {
    // checking for invalid conditions
    if(!data.minCount || !data.maxCount || !data.startDate || !data.endDate) {
        cb("missing argument");
        return;
    }
    
    if(data.minCount > data.maxCount) {
        cb("minCount can't be greater than max count");
        return;
    }
    if(typeof(data.minCount) !== "number" || Number.isNaN(data.minCount)
        || typeof(data.maxCount) !== "number" || Number.isNaN(data.maxCount)) {
        cb("invalid count");
        return;
    }
    // the counts array can be negative, so our limits can also be negative

    const startDate = new Date(`${data.startDate}T00:00:00.000Z`);
    const endDate =  new Date(`${data.endDate}T23:59:59.999Z`);
    // kind of sad that i have to do this to detect invalid dates
    if(startDate.getTime() !== startDate.getTime() || startDate.getTime() !== startDate.getTime()) {
        cb("invalid start or end date");
        return;
    }
    if(startDate > endDate) {
        cb("start date can't be greater than end date");
        return;
    }

    // not sure what I should do if the model is invalid for some reason

    // this query is unnecessarily complicated, IMO. Looks just like a broken way to write some sql
    // the query included for comparison.
    // select id, createdAt, sum(counts) as totalCounts from records 
    //        group by _id 
    //        having sum(counts) between minValue and maxValue
    //        where createdAt between startDate and endDate;
    const recs = model.aggregate([
        { $match: {
            // this was probably my biggest hurdle in all of this, the aggregate query was easy,
            // this one just didn't seem to work at all no matter what I try
            createdAt: {
                $gt: startDate,
                $lt: endDate
            }
        }},
        { $addFields: {
            totalCount: {$sum: "$counts"}
        }},
        { $project: {
            _id: 1,
            createdAt: 1,
            totalCount: 1
        }},
        { $match: {
            totalCount: {
                $gt: data.minCount,
                $lt: data.maxCount
            }
        }}
    ]);

    recs.exec(cb);
};

module.exports = search;