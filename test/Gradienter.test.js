var assert = require('assert');

describe('Gradienter', function() {
    var Gradienter = require('../src/Gradienter.js');


    describe('._groupedByColor', function () {
        it('Пустые данные', function() {
            assert.doesNotThrow(function() {
                var gradienter = new Gradienter();
                gradienter._groupedByColor();
            });

            assert.doesNotThrow(function() {
                var gradienter = new Gradienter([]);
                gradienter._groupedByColor();
            });
        });

        it('Правильная группировка', function() {
            var gradienter = new Gradienter([
                {x: 1, y: 1, z: 0},
                {x: 2, y: 2, z: 5},
                {x: 3, y: 3, z: 5}
            ])._groupedByColor();
            assert.equal(gradienter._grouped.length, 2, 'Должно быть 2 цветовые группы');
            assert.equal(gradienter._grouped[0].color, 0, 'Цвет первой группы должен быть = 0');
            assert.equal(gradienter._grouped[1].color, 5, 'Цвет второй группы должен быть = 5');

            gradienter = new Gradienter([
                {x: 1, y: 1, z: 0},
                {x: 2, y: 2, z: 5},
                {x: 3, y: 3, z: 5},
                {x: 3, y: 3, z: 10}
            ])._groupedByColor();
            assert.equal(gradienter._grouped.length, 3, 'Должно быть 3 цветовые группы')
            assert.equal(gradienter._grouped[0].color, 0, 'Цвет первой группы должен быть = 0');
            assert.equal(gradienter._grouped[1].color, 5, 'Цвет второй группы должен быть = 5');
            assert.equal(gradienter._grouped[2].color, 10, 'Цвет третьей группы должен быть = 5');
        });

        it('Дополнение одной точки до отрезка', function() {
            var gradienter = new Gradienter([
                {x: 1, y: 1, z: 0},
                {x: 2, y: 2, z: 5},
                {x: 3, y: 3, z: 5}
            ])._groupedByColor();
            assert.equal(gradienter._grouped.length, 2, 'Должно быть 2 цветовые группы')
            assert.equal(gradienter._grouped[0].points.length, 2, 'Первая группа должна быть дополнена точкой')
            assert.deepEqual(gradienter._grouped[0].points[1], {x: 1, y: 1, z: 0}, 'Первая группа должна быть дополнена точкой эквивалентной первой')
        });
    });

    describe('._setGroupsDistance', function () {
        it('Подсчет длины и пометка на удаление', function() {
            var gradienter = new Gradienter();
            gradienter._grouped = [
                {
                    points: [
                        {x: 1, y: 0, z: 0},
                        {x: 1, y: 2, z: 0},
                        {x: 1, y: 600, z: 0}
                    ],
                    color: 0
                }, {
                    points: [
                        {x: 1, y: 1, z: 5},
                        {x: 1, y: 1, z: 5}
                    ],
                    color: 5
                }
            ];
            gradienter._setGroupsDistance();

            assert.equal(gradienter._grouped.length, 2, 'Должно быть 2 цветовые группы');
            assert.equal(gradienter._grouped[0].distance, 600, 'Длина первой группы должна быть = 600');
            assert.equal(gradienter._grouped[0].toDelete, false, 'Первая группа не должна быть помечена на удаление');
            assert.equal(gradienter._grouped[1].distance, 0, 'Длина первой группы должна быть = 0');
            assert.equal(gradienter._grouped[1].toDelete, true, 'Вторая группа не должна быть помечена на удаление');
        });
    });

    describe('._cleanGrouped', function () {
        it('Удаление пустых групп', function() {
            var gradienter = new Gradienter();
            gradienter._grouped = [null, {}, {points: []}];
            gradienter._cleanGrouped();

            assert.equal(gradienter._grouped.length, 0, 'Все пустые группы должы быть удалены');
        });
    });

    describe('._setGradientsLength', function () {
        it('Начальный и конечный не имеют градиентов', function() {
            var gradienter = new Gradienter();
            gradienter._grouped = [{
                points: [
                    {x: 0, y: 0, z: 5},
                    {x: 0, y: 5, z: 5}
                ],
                distance: 5,
                color: 5
            }, {
                points: [
                    {x: 0, y: 0, z: 0},
                    {x: 0, y: 10, z: 0}
                ],
                distance: 10,
                color: 0
            }
            ];
            gradienter._setGradientsLength();

            assert.equal(gradienter._grouped[0].startGradient, 0, 'У первого участка не должно быть начального градиента');
            assert.equal(gradienter._grouped[1].endGradient, 0, 'У последнего участка не должно быть конечного градиента');
        });

        it('Срабатывает максимальное ограничение', function() {
            var gradienter = new Gradienter();
            gradienter._grouped = [
                {
                    points: [
                        {x: 0, y: 0, z: 5},
                        {x: 0, y: 100, z: 5}
                    ],
                    distance: 100,
                    color: 5
                }, {
                    points: [
                        {x: 0, y: 0, z: 0},
                        {x: 0, y: 100, z: 0}
                    ],
                    distance: 100,
                    color: 0
                }
            ];
            gradienter._setGradientsLength();

            assert.equal(gradienter._grouped[0].endGradient, gradienter._maxGradient, 'Для большого конечного градиента выставилось ограничение в _maxGradient');
            assert.equal(gradienter._grouped[1].startGradient, gradienter._maxGradient, 'Для большого начального градиента выставилось ограничение в _maxGradient');
        });

        it('Срабатывает минимальное ограничение', function() {
            var gradienter = new Gradienter();
            gradienter._grouped = [{
                    points: [
                        {x: 0, y: 0, z: 5},
                        {x: 0, y: 5, z: 5}
                    ],
                    distance: 5,
                    color: 5
                }, {
                    points: [
                        {x: 0, y: 0, z: 0},
                        {x: 0, y: 10, z: 0}
                    ],
                    distance: 10,
                    color: 0
                }
            ];
            gradienter._setGradientsLength();

            assert.equal(gradienter._grouped[0].endGradient, gradienter._minGradient, 'Для маленького конечного градиента выставилось ограничение в _minGradient');
            assert.equal(gradienter._grouped[1].startGradient, gradienter._minGradient, 'Для маленького начального градиента выставилось ограничение в _minGradient');
        });

        it('Срабатывает процентное соотношение для расчета длины', function() {
            var gradienter = new Gradienter();
            gradienter._grouped = [{
                points: [
                    {x: 0, y: 0, z: 5},
                    {x: 0, y: 200, z: 5}
                ],
                distance: 200,
                color: 5
            }, {
                points: [
                    {x: 0, y: 0, z: 0},
                    {x: 0, y: 100, z: 0}
                ],
                distance: 100,
                color: 0
            }
            ];
            gradienter._setGradientsLength();

            assert.equal(gradienter._grouped[0].endGradient, gradienter._gradientPercent, 'Длина градиента должна быть (_gradientPercent)% от меньшего из соседних отрезков');
            assert.equal(gradienter._grouped[1].startGradient, gradienter._gradientPercent, 'Длина градиента должна быть (_gradientPercent)% от меньшего из соседних отрезков');
        });
    });

    describe('._deleteShortGroups', function () {

        it('Группы не отмеченные на удаление остаются не тронутыми', function() {
            var gradienter = new Gradienter();
            var grouped = [{
                points: [
                    {x: 0, y: 0, z: 5},
                    {x: 0, y: 200, z: 5}
                ],
                toDelete: false,
                color: 5
            }, {
                points: [
                    {x: 0, y: 0, z: 0},
                    {x: 0, y: 100, z: 0}
                ],
                toDelete: false,
                color: 0
            }];
            gradienter._grouped = grouped;
            gradienter._deleteShortGroups();

            assert.deepEqual(gradienter._grouped, grouped, 'Группы не должны были измениться');
        });

        it('Группы отмеченные на удаление удалены', function() {
            var gradienter = new Gradienter();
            gradienter._grouped = [{
                points: [
                    {x: 0, y: 0, z: 5},
                    {x: 0, y: 200, z: 5}
                ],
                toDelete: true,
                color: 5
            }, {
                points: [
                    {x: 0, y: 0, z: 0},
                    {x: 0, y: 100, z: 0}
                ],
                toDelete: false,
                color: 0
            }];
            gradienter._deleteShortGroups();

            assert.equal(gradienter._grouped.length, 1, 'Группа помеченная на удаление должна была удалиться');
        });

        it('Приписание точек к сделующей группе', function() {
            var gradienter = new Gradienter();
            gradienter._grouped = [{
                points: [
                    {x: 0, y: 0, z: 5},
                    {x: 0, y: 200, z: 5}
                ],
                toDelete: false,
                distance: 200,
                color: 5
            }, {
                points: [
                    {x: 3, y: 3, z: 0},
                    {x: 3, y: 100, z: 0}
                ],
                toDelete: true,
                distance: 97,
                color: 0
            }, {
                points: [
                    {x: 5, y: 5, z: 5},
                    {x: 5, y: 500, z: 5}
                ],
                toDelete: false,
                distance: 495,
                color: 5
            }];
            gradienter._deleteShortGroups();

            assert.equal(gradienter._grouped.length, 2, 'Группа помеченная на удаление должна была удалиться');
            assert.equal(gradienter._grouped[0].points.length, 2, 'Первая группа не должна была измениться');
            assert.equal(gradienter._grouped[1].points.length, 4, 'К последней группе должны быть добавлены точки из удаленной');
            assert.deepEqual(gradienter._grouped[1].points[0], {x: 3, y: 3, z: 5}, 'Точки должны были добавиться в начало последнего отрезка, цвет должен стать как у отрезка');
            assert.deepEqual(gradienter._grouped[1].points[1], {x: 3, y: 100, z: 5}, 'Точки должны были добавиться в начало последнего отрезка, цвет должен стать как у отрезка');
        });

        it('Приписание точек к предыдущей группе', function() {
            var gradienter = new Gradienter();
            gradienter._grouped = [{
                points: [
                    {x: 0, y: 0, z: 5},
                    {x: 0, y: 200, z: 5}
                ],
                toDelete: false,
                distance: 200,
                color: 5
            }, {
                points: [
                    {x: 3, y: 3, z: 0},
                    {x: 3, y: 100, z: 0}
                ],
                toDelete: true,
                distance: 0,
                color: 0
            }, {
                points: [
                    {x: 5, y: 5, z: 5},
                    {x: 5, y: 10, z: 5}
                ],
                toDelete: false,
                distance: 5,
                color: 0
            }];
            gradienter._deleteShortGroups();

            assert.equal(gradienter._grouped.length, 2, 'Группа помеченная на удаление должна была удалиться');
            assert.equal(gradienter._grouped[0].points.length, 4, 'К первой группе должны быть добавлены точки из удаленной');
            assert.equal(gradienter._grouped[1].points.length, 2, 'Последняя группа не должна была измениться');
            assert.deepEqual(gradienter._grouped[0].points[2], {x: 3, y: 3, z: 5}, 'Точки должны были добавиться в конец первого отрезка, цвет должен стать как у отрезка');
            assert.deepEqual(gradienter._grouped[0].points[3], {x: 3, y: 100, z: 5}, 'Точки должны были добавиться в конец первого отрезка, цвет должен стать как у отрезка');
        });

    });

    describe('._calculateGradientPoints', function () {
        it('Расчет точек градиента на горизонтальной прямой', function() {
            var gradienter = new Gradienter();
            gradienter._grouped = [{
                points: [
                    {x: 0, y: 0, z: 0},
                    {x: 5, y: 0, z: 0}
                ],
                startGradient: 1,
                endGradient: 1
            }];
            gradienter._calculateGradientPoints();

            assert.equal(gradienter._grouped[0].points.length, 4, 'Должны были добавиться 2 точки градиента');
            assert.deepEqual(gradienter._grouped[0].points[0], {x: 0, y: 0, z: undefined}, 'У первой точки цвет должен стереться');
            assert.deepEqual(gradienter._grouped[0].points[1], {x: 1, y: 0, z: 0}, 'Точка начально градиента должна быть в {x: 1, y: 0}');
            assert.deepEqual(gradienter._grouped[0].points[2], {x: 4, y: 0, z: 0}, 'Точка конечного градиента должна быть в {x: 4, y: 0}');
            assert.deepEqual(gradienter._grouped[0].points[3], {x: 5, y: 0, z: undefined}, 'У последней точки цвет должен стереться');
        });

        it('Расчет точек градиента на вертикальной прямой', function() {
            var gradienter = new Gradienter();
            gradienter._grouped = [{
                points: [
                    {x: 0, y: 0, z: 0},
                    {x: 0, y: 5, z: 0}
                ],
                startGradient: 1,
                endGradient: 1
            }];
            gradienter._calculateGradientPoints();

            assert.equal(gradienter._grouped[0].points.length, 4, 'Должны были добавиться 2 точки градиента');
            assert.deepEqual(gradienter._grouped[0].points[0], {x: 0, y: 0, z: undefined}, 'У первой точки цвет должен стереться');
            assert.deepEqual(gradienter._grouped[0].points[1], {x: 0, y: 1, z: 0}, 'Точка начально градиента должна быть в {x: 0, y: 1}');
            assert.deepEqual(gradienter._grouped[0].points[2], {x: 0, y: 4, z: 0}, 'Точка конечного градиента должна быть в {x: 0, y: 4}');
            assert.deepEqual(gradienter._grouped[0].points[3], {x: 0, y: 5, z: undefined}, 'У последней точки цвет должен стереться');
        });

        it('Расчет точек градиента на наклонной прямой', function() {
            var gradienter = new Gradienter();
            gradienter._grouped = [{
                points: [
                    {x: 0, y: 0, z: 0},
                    {x: 5, y: 5, z: 0}
                ],
                startGradient: Math.sqrt(2),
                endGradient: Math.sqrt(2)
            }];
            gradienter._calculateGradientPoints();

            assert.equal(gradienter._grouped[0].points.length, 4, 'Должны были добавиться 2 точки градиента');
            assert.deepEqual(gradienter._grouped[0].points[0], {x: 0, y: 0, z: undefined}, 'У первой точки цвет должен стереться');
            assert.deepEqual(gradienter._grouped[0].points[1], {x: 1, y: 1, z: 0}, 'Точка начально градиента должна быть в {x: 1, y: 1}');
            assert.deepEqual(gradienter._grouped[0].points[2], {x: 4, y: 4, z: 0}, 'Точка конечного градиента должна быть в {x: 4, y: 4}');
            assert.deepEqual(gradienter._grouped[0].points[3], {x: 5, y: 5, z: undefined}, 'У последней точки цвет должен стереться');
        });

    });
});