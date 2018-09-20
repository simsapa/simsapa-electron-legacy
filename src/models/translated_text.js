'use strict';

module.exports = (sequelize, DataTypes) => {

  const TranslatedText = sequelize.define('TranslatedText', {
      uid:              DataTypes.STRING,
      author_uid:       DataTypes.STRING,
      acronym:          DataTypes.STRING,
      volpage:          DataTypes.STRING,
      root_title:       DataTypes.STRING,
      translated_title: DataTypes.STRING,
      content_language: DataTypes.STRING,
      content_plain:    DataTypes.STRING,
      content_html:     DataTypes.STRING
  }, {});

  TranslatedText.associate = function(models) {};

  return TranslatedText;
};
