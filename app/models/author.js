'use strict';

module.exports = (sequelize, DataTypes) => {

  const Author = sequelize.define('Author', {
    uid:        DataTypes.STRING,
    blurb:      DataTypes.STRING,
    long_name:  DataTypes.STRING,
    short_name: DataTypes.STRING
  }, {});

  Author.associate = function(models) {};

  return Author;
};
