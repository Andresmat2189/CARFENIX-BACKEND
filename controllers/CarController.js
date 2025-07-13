const Car = require('../models/car');

exports.getCars = async (req, res) => {
  const { brand } = req.query;
  const filter = brand ? { brand } : {};
  const cars = await Car.find(filter);
  res.json(cars);
};

exports.createCar = async (req, res) => {
  const car = new Car(req.body);
  await car.save();
  res.status(201).json(car);
};
