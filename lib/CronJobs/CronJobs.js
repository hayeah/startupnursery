function CronJobs() {
    this.jobs = {};
    this.nextTicks = [];
    this.timeout = undefined;
    this.running = false;
}

CronJobs.prototype.INTERVAL_UNIT = 1;

CronJobs.prototype.addJob = function (id, config, onTick) {
    var date = Date.now();
    if (typeof(id) == "object" && typeof(config) == "function") {
        onTick = config;
        config = id;
        id = config.id;
    }
    if (this.jobs[id] == undefined) {
        var nextTick;
        var interval = config.interval * this.INTERVAL_UNIT;
        if (config.start == undefined) {
            nextTick = date + interval;
        } else if (config.start > date || interval <= 0) {
            nextTick = config.start;
        } else {
            nextTick = (parseInt((date - config.start) / interval) + 1) * interval + config.start;
        }
        this.jobs[id] = {
            id:id,
            nextTick:nextTick,
            config:config,
            onTick:onTick
        };
        this.nextTicks.push(this.jobs[id]);
        this.updateNextTick();
        if (this.running) {
            this.stop();
            this.start();
        }
    }
};

CronJobs.prototype.updateNextTick = function () {
    this.nextTicks.sort(function (a, b) {
        if (a.nextTick > b.nextTick)
            return 1;
        if (a.nextTick < b.nextTick)
            return -1;
        return 0;
    });
};

CronJobs.prototype.tick = function () {
    var self = this;
    while (self.nextTicks.length > 0 && self.nextTicks[0].nextTick <= Date.now()) {
        var job = self.nextTicks[0];
        job.onTick(job.config);
        if (job.config.interval > 0) {
            job.nextTick += job.config.interval * self.INTERVAL_UNIT;
        } else {
            this.removeJob(job.id);
        }
        self.updateNextTick();
    }
    if (self.nextTicks.length > 0) {
        self.timeout = setTimeout(function () {
            self.tick();
        }, self.nextTicks[0].nextTick - Date.now());
    }
};

CronJobs.prototype.editJob = function (id, config) {
    var job = this.jobs[id];

    if (job) {
        for (var i in config) {
            job.config[i] = config[i];
        }
    }
};

CronJobs.prototype.removeJob = function (id) {
    var job = this.jobs[id];

    if (job) {
        var index = this.nextTicks.indexOf(job);
        if (index >= 0) {
            this.nextTicks.splice(index, 1);
        }
        delete this.jobs[id];
    }
};

CronJobs.prototype.start = function () {
    if (this.running) return;

    this.tick();
    this.running = true;
};

CronJobs.prototype.stop = function () {
    if (!this.running) return;

    clearTimeout(this.timeout);
    this.running = false;
};

module.exports = new CronJobs();
