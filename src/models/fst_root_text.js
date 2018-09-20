'use strict';

module.exports = (sequelize, DataTypes) => {

  const FtsRootText = sequelize.define('FtsRootText', {
      rowid:         DataTypes.INTEGER,
      content_plain: DataTypes.STRING
  }, {});

  FtsRootText.associate = function(models) {};

  return FtsRootText;
};
