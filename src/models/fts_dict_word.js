'use strict';

module.exports = (sequelize, DataTypes) => {

  const FtsDictWord = sequelize.define('FtsDictWord', {
      rowid:      DataTypes.INTEGER,
      definition: DataTypes.STRING,
      summary:    DataTypes.STRING
  }, {});

  FtsDictWord.associate = function(models) {};

  return FtsDictWord;
};
