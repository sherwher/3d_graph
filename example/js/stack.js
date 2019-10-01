
function Stack() {

    var stack = [];

    this.getLength = function () {
        return stack.length;
    }

    this.isEmpty = function () {
        return (stack.length == 0);
    }

    this.push = function (item) {
        stack.unshift(item);
    }

    this.pop = function () {
        if (stack.length == 0) return undefined;

        var item = stack.shift();

        return item;
    }

}
