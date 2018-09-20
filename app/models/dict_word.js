'use strict';

module.exports = (sequelize, DataTypes) => {

  const DictWord = sequelize.define('DictWord', {
      word:         DataTypes.STRING,
      definition:   DataTypes.STRING,
      summary:      DataTypes.STRING,
      grammar:      DataTypes.STRING,
      entry_source: DataTypes.STRING,
      from_lang:    DataTypes.STRING,
      to_lang:      DataTypes.STRING
  }, {});

  DictWord.associate = function(models) {};

  return DictWord;
};
