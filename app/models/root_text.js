'use strict';

module.exports = (sequelize, DataTypes) => {

  const RootText = sequelize.define('RootText', {
      uid:              DataTypes.STRING,
      author_uid:       DataTypes.STRING,
      acronym:          DataTypes.STRING,
      volpage:          DataTypes.STRING,
      title:            DataTypes.STRING,
      content_language: DataTypes.STRING,
      content_plain:    DataTypes.STRING,
      content_html:     DataTypes.STRING
  }, {});

  RootText.associate = function(models) {};

  return RootText;
};
