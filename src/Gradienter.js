function makeGradienter() {
    var MathUtil = {
        /**
         * Откладываем от point1 расстояние distance в направлении point2
         *
         * @param point1
         * @param point2
         * @param distance
         * @returns {*}
         */
        findPointOnLine: function (point1, point2, distance) {
            if (distance === 0) {
                return point1;
            }

            var x1 = point1.x;
            var y1 = point1.y;
            var x2 = point2.x;
            var y2 = point2.y;

            // Вычисляем направляющий вектор прямой
            var P = [x2 - x1, y2 - y1];
            // Вычисляем длину направляющего вектора
            var pLen = Math.sqrt(P[0] * P[0] + P[1] * P[1]);
            // Вычисляем единичный направляющий вектор прямой
            var unitP = [P[0] / pLen, P[1] / pLen]; // Возможно нужно учесть направление, проверить на практике. Коллинеарность вообще-то не означает сонаправленность.
            // Вычисляем координаты искомой точки
            return {x: x1 + distance * unitP[0], y: y1 + distance * unitP[1]};
        },

        distanceTo: function(point1, point2) {
            return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
        }
    };

    /**
     * Рассчитывает градиенты
     */
    function Gradienter(data, options) {
        options = options || {};

        this._data = data || [];
        this._grouped = [];
        this._gradientPercent = options.gradientPercent || 30;
        this._minGradient = options.minGradient || 10;
        this._minColorLength = options.minColorLength || 20;
        this._maxGradient = options.maxGradient || 30;
        this._needRecalc = true;
    }

    /**
     * Группировка точек по цвету
     * @returns {Gradienter}
     */
    Gradienter.prototype._groupedByColor = function() {
        // Группируем по значению z у подряд идущих точек
        var i, pathLength, pointCurrent, prevZ, groupedTmp = [];
        for (i = 0, pathLength = this._data.length; i < pathLength; i++) {
            pointCurrent = this._data[i];
            if (pointCurrent.z === prevZ) {
                groupedTmp.push(pointCurrent);
            } else {
                if (groupedTmp.length) {
                    if (groupedTmp.length === 1) {
                        groupedTmp.push(groupedTmp[0]);
                        }
                    this._grouped.push({
                        points: groupedTmp,
                        color: groupedTmp[0].z
                    });
                }
                groupedTmp = [pointCurrent];
            }
            prevZ = pointCurrent.z;
        }
        if (groupedTmp.length) {
            this._grouped.push({
                points: groupedTmp,
                color: groupedTmp[0].z
            });
        }

        return this;
    };
    /**
     * Расчет отрезков одного цвета
     * @returns {Gradienter}
     */
    Gradienter.prototype._setGroupsDistance = function() {
        // Высчитываем длину каждого участка
        var i, j, groupedLength, group, groupPointsLength, pointNext, pointCurrent, distance = 0;
        for (i = 0, groupedLength = this._grouped.length; i < groupedLength; i++) {
            group = this._grouped[i];
            distance = 0;

            for (j = 0, groupPointsLength = group.points.length; j < groupPointsLength; j++) {
                pointCurrent = group.points[j];
                pointNext = group.points[j + 1];

                if (pointNext) {
                    distance += MathUtil.distanceTo(pointCurrent, pointNext);
                }
            }

            group.distance = distance;
            group.toDelete = this._minColorLength > group.distance;
        }
        return this;
    };
    /**
     * Удаляем пустые группы
     */
    Gradienter.prototype._cleanGrouped = function() {
        var i, groupedLength, newGrouped = [], group;
        for (i = 0, groupedLength = this._grouped.length; i < groupedLength; i++) {
            group = this._grouped[i];
            if (group && group.points && group.points.length) {
                newGrouped.push(this._grouped[i]);
            }
        }
        this._grouped = newGrouped;
        return this;
    };
    /**
     * Расчет длин градиента
     * @returns {Gradienter}
     */
    Gradienter.prototype._setGradientsLength = function() {
        var i, group, groupedLength, nextGroup, prevGroup;
        for (i = 0, groupedLength = this._grouped.length; i < groupedLength; i++) {
            // Рассчитываем градиенты для начала и конца для участка, загоняя в рамки _maxGradient и _minGradient
            prevGroup = this._grouped[i - 1];
            group = this._grouped[i];
            nextGroup = this._grouped[i + 1];

            group.startGradient = 0;
            if (prevGroup) {
                group.startGradient = Math.floor(Math.min(prevGroup.distance, group.distance) * this._gradientPercent / 100);
                group.startGradient = Math.max(Math.min(group.startGradient, this._maxGradient), this._minGradient);
            }
            group.endGradient = 0;
            if (nextGroup) {
                group.endGradient = Math.floor(Math.min(nextGroup.distance, group.distance) * this._gradientPercent / 100);
                group.endGradient = Math.max(Math.min(group.endGradient, this._maxGradient), this._minGradient);
            }
        }
        return this;
    };
    Gradienter.prototype.changePointsColor = function(color, points) {
        var i, pointsLength;
        for (i = 0, pointsLength = points.length; i < pointsLength; i++) {
            points[i].z = color;
        }
        return points;
    };
    /**
     * Расчет точек начала и конца градиента
     * @returns {Gradienter}
     */
    Gradienter.prototype._calculateGradientPoints = function() { // !!!
        var i, j, pointCurrent, newPoint, groupedLength, group, groupPointsLength, pointNext, distance = 0;
        for (i = 0, groupedLength = this._grouped.length; i < groupedLength; i++) {
            group = this._grouped[i];
            // Находим точку начала и конца градиента
            // Перебираем точки, считаем дистанцию, как только она перевалила за значение для градиента
            if (group.startGradient) {
                distance = 0;
                var prevDistance = 0;
                for (j = 0, groupPointsLength = group.points.length; j < groupPointsLength; j++) {
                    pointCurrent = group.points[j];
                    pointNext = group.points[j + 1];

                    if (pointNext) {
                        distance += MathUtil.distanceTo(pointCurrent, pointNext);
                    }

                    if (distance > group.startGradient) {
                        // находим точную точку начала
                        // Задаем ей pointCurrent.z
                        // Выходим из цикла
                        newPoint = MathUtil.findPointOnLine(pointCurrent, pointNext, group.startGradient - prevDistance);
                        newPoint.z = pointNext.z;
                        group.points = group.points.slice(0, j + 1).concat([newPoint]).concat(group.points.slice(j + 1));
                        break;
                    }

                    prevDistance = distance;
                }
            }

            // То же самое, но для конца градиента
            if (group.endGradient) {
                distance = 0;
                var pointPrev;
                for (groupPointsLength = group.points.length - 1, j = groupPointsLength; j >= 0; j--) {
                    pointCurrent = group.points[j];
                    pointPrev = group.points[j - 1];

                    if (pointPrev) {
                        distance += MathUtil.distanceTo(pointCurrent, pointPrev);
                    }

                    if (distance > group.endGradient) {
                        newPoint = MathUtil.findPointOnLine(pointPrev, pointCurrent, distance - group.endGradient);
                        newPoint.z = pointCurrent.z;
                        group.points = group.points.slice(0, j).concat([newPoint]).concat(group.points.slice(j));
                        break;
                    }
                }
            }

            if (group.startGradient && group.points[0]) {
                group.points[0].z = undefined;
            }
            if (group.endGradient && group.points[group.points.length - 1]) {
                group.points[group.points.length - 1].z = undefined;
            }
        }
        return this;
    };
    /**
     * Получение нового массива точек
     * @returns {Array}
     */
    Gradienter.prototype._getPathByGrouped = function() {
        var i, groupedLength, path = [];
        for (i = 0, groupedLength = this._grouped.length; i < groupedLength; i++) {
            // При склеивании надо убирать последнюю точку у всех, кроме последнего, т.к. они дублируются
            var toConcat = this._grouped[i].points;
            if (i !== groupedLength - 1) {
                toConcat.pop();
            }
            path = path.concat(toConcat);
        }
        return path;
    };
    Gradienter.prototype._calculateGradientLength = function() {
        while (this._needRecalc) {
            this._needRecalc = false;
            this._setGroupsDistance()._deleteShortGroups();
        }
        this._setGradientsLength();
        return this;
    };
    Gradienter.prototype._deleteShortGroups = function() {
        var i, group, groupedLength, nextGroup, prevGroup;
        for (i = 0, groupedLength = this._grouped.length; i < groupedLength; i++) {
            prevGroup = this._grouped[i - 1];
            group = this._grouped[i];
            nextGroup = this._grouped[i + 1];
            if (group.toDelete && (prevGroup || nextGroup)) {
                // Приписываем к предыдущей, если следующей нет, либо следующая короче
                if (prevGroup && (!nextGroup || prevGroup.distance > nextGroup.distance)) {
                    group.points = this.changePointsColor(prevGroup.color, group.points);
                    prevGroup.points = prevGroup.points.concat(group.points);
                } else if (nextGroup) {
                    group.points = this.changePointsColor(nextGroup.color, group.points);
                    nextGroup.points = group.points.concat(nextGroup.points);
                }
                delete this._grouped[i];
                this._needRecalc = true;
            }
        }
        return this._cleanGrouped();
    };
    Gradienter.prototype.getGradientPath = function() {
        return this._groupedByColor()._calculateGradientLength()._calculateGradientPoints()._getPathByGrouped();
    };

    return Gradienter;
}

module.exports = makeGradienter();
