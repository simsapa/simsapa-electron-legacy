'use strict';

module.exports = (sequelize, DataTypes) => {

  const FtsDictWord = sequelize.define('FtsDictWord', {
      rowid:            DataTypes.INTEGER,
      word:             DataTypes.STRING,
      definition_plain: DataTypes.STRING,
      summary:          DataTypes.STRING
  }, {});

  FtsDictWord.associate = function(models) {};

  return FtsDictWord;
};
