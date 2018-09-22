module Types exposing (..)

import Markdown.Config as MDConf
import RemoteData exposing (WebData)


type alias Author =
    { id : Int
    , uid : String
    , blurb : String
    , long_name : String
    , short_name : String
    }


type alias RootText =
    { id : Int
    , uid : String
    , author_uid : String
    , acronym : String
    , volpage : String
    , title : String
    , content_language : String
    , content_plain : String
    , content_html : String
    }


type alias TranslatedText =
    { id : Int
    , uid : String
    , author_uid : String
    , acronym : String
    , volpage : String
    , root_title : String
    , translated_title : String
    , content_language : String
    , content_plain : String
    , content_html : String
    }


type alias PoMessage =
    { msgid : String
    , msgstr : String
    , msgctxt : String
    , encoding : String
    , comment : String
    , linenum : Int
    }


type alias TextQueryData =
    { root_texts : List RootText
    , translated_texts : List TranslatedText
    }


type SelectedText
    = SelectedRootText RootText
    | SelectedTranslatedText TranslatedText


type alias TextReadState =
    { selectedText : Maybe SelectedText }


type alias TextSearchState =
    { lookupQuery : String
    , lookupResults : WebData TextQueryData
    , selectedText : Maybe SelectedText
    , selectedTextList : List SelectedText
    }


type alias LookupState =
    { currentWord : WebData (List DictWord) }


type alias DictionarySearchState =
    { lookupQuery : String
    , lookupResults : WebData (List DictWord)
    , selectedWordsList : List DictWord
    }


type alias DictWord =
    { id : Int
    , word : String
    , definition : String
    , summary : String
    , grammar : String
    , entry_source : String
    , from_lang : String
    , to_lang : String
    }


mdRawHtml =
    Just (MDConf.Options False MDConf.ParseUnsafe)
