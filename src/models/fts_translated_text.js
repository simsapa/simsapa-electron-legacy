'use strict';

module.exports = (sequelize, DataTypes) => {

  const FtsTranslatedText = sequelize.define('FtsTranslatedText', {
      rowid:         DataTypes.INTEGER,
      content_plain: DataTypes.STRING
  }, {});

  FtsTranslatedText.associate = function(models) {};

  return FtsTranslatedText;
};
