module View.SearchTexts exposing (Model, Msg, initialModel, update, view)

import Bulma.Columns exposing (..)
import Bulma.Components exposing (..)
import Bulma.Elements as BE exposing (..)
import Bulma.Form exposing (..)
import Bulma.Layout as BL exposing (..)
import Bulma.Modifiers exposing (..)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (onClick, onInput)
import Http
import Json.Decode as Decode exposing (Decoder, int, list, string)
import Json.Decode.Pipeline exposing (required)
import Markdown
import Markdown.Config as MDConf
import RemoteData exposing (WebData)
import Url.Builder as UB exposing (absolute)


cM =
    columnModifiers


cSM =
    columnsModifiers


view : (Msg m -> m) -> Html m -> Model -> List (Html m)
view lift topNav model =
    if model.isReadingExpanded then
        [ columns myColumnsModifiers
            [ class "page-wrap-with-scroll" ]
            [ column cM
                [ class "page-content-outer-reading-with-scroll" ]
                [ div [ class "page-content-inner-reading-with-scroll" ]
                    [ readingHero lift model ]
                ]
            ]
        ]

    else
        [ columns myColumnsModifiers
            [ class "page-wrap-with-scroll" ]
            [ column cM
                [ class "page-content-outer-controls-with-scroll" ]
                [ div [ class "page-content-inner-controls-with-scroll" ]
                    [ topNav
                    , BL.section Spaced
                        []
                        [ searchInput lift model
                        , viewLookupResults lift model
                        ]
                    ]
                ]
            , column cM
                [ class "page-content-outer-reading-with-scroll" ]
                [ div [ class "page-content-inner-reading-with-scroll" ]
                    [ readingHero lift model ]
                ]
            ]
        ]


readingHero lift model =
    let
        contentHeading =
            [ viewSelectedTextHeader lift model ]

        contentBody =
            [ viewSelectedTextBody lift model ]

        contentWrapper =
            if model.isReadingExpanded then
                container

            else
                div
    in
    div [ class "reading" ]
        [ selectedTextListTabs lift model
        , readButton lift model
        , contentWrapper
            [ class "reading" ]
            [ hero { bold = False, size = Medium, color = Default }
                []
                [ heroBody [] contentHeading ]
            , div [ class "content" ] contentBody
            ]
        ]


selectedTextListTabs : (Msg m -> m) -> Model -> Html m
selectedTextListTabs lift model =
    tabs { style = Boxed, alignment = Left, size = Standard }
        []
        []
        (List.map (\x -> textListTab x lift model) model.selectedTextList)


textListTab : SelectedText -> (Msg m -> m) -> Model -> Html m
textListTab t lift model =
    let
        isCurrentReading =
            case model.selectedText of
                Just sel_t ->
                    getUid t == getUid sel_t

                Nothing ->
                    False
    in
    case t of
        SelectedRootText t_ ->
            tab isCurrentReading
                [ onClick (lift (SetSelectedReadText t)) ]
                []
                [ span [ class "tab-acronym" ] [ text t_.acronym ]
                , span [ class "tab-title" ] [ text t_.title ]
                ]

        SelectedTranslatedText t_ ->
            tab isCurrentReading
                [ onClick (lift (SetSelectedReadText t)) ]
                []
                [ span [ class "tab-acronym" ] [ text t_.acronym ]
                , span [ class "tab-title" ] [ text t_.title ]
                ]


readButton : (Msg m -> m) -> Model -> Html m
readButton lift model =
    let
        arrowIcon =
            if model.isReadingExpanded then
                "mdi-arrow-expand-right"

            else
                "mdi-arrow-expand-left"
    in
    BE.button { buttonModifiers | rounded = True }
        [ onClick (lift ToggleExpandReading)
        , class "readbutton"
        ]
        [ icon Standard [] [ i [ class ("mdi " ++ arrowIcon) ] [] ] ]


viewLookupResults : (Msg m -> m) -> Model -> Html m
viewLookupResults lift model =
    case model.lookupResults of
        RemoteData.NotAsked ->
            div [] []

        RemoteData.Loading ->
            div [] [ text "loading" ]

        RemoteData.Failure _ ->
            div [] [ text "O NOES" ]

        RemoteData.Success res ->
            viewQueryData lift res model


viewQueryData : (Msg m -> m) -> TextQueryData -> Model -> Html m
viewQueryData lift data model =
    div []
        [ div [] (List.map (\x -> viewRootTextRow lift x model) data.root_texts)
        , div [] (List.map (\x -> viewTranslatedTextRow lift x model) data.translated_texts)
        ]


viewRootTextRow : (Msg m -> m) -> RootText -> Model -> Html m
viewRootTextRow lift root_text model =
    let
        words =
            String.words root_text.content_plain

        snippet =
            if List.length words > 20 then
                String.join " " (List.take 20 words) ++ "..."

            else
                String.join " " words
    in
    Html.div
        [ class "hover-gray"
        , style "padding" "0.5em"
        , onClick (lift (AddToSelectedTexts (SelectedRootText root_text)))
        ]
        [ Html.div
            [ style "font-weight" "bold" ]
            [ text root_text.acronym ]
        , Html.div
            [ style "font-weight" "bold" ]
            [ text root_text.title ]
        , Html.div
            [ style "padding-left" "1em" ]
            [ text snippet ]
        ]


viewTranslatedTextRow : (Msg m -> m) -> TranslatedText -> Model -> Html m
viewTranslatedTextRow lift translated_text model =
    let
        words =
            String.words translated_text.content_plain

        snippet =
            if List.length words > 20 then
                String.join " " (List.take 20 words) ++ "..."

            else
                String.join " " words
    in
    Html.div
        [ class "hover-gray"
        , style "padding" "0.5em"
        , onClick (lift (AddToSelectedTexts (SelectedTranslatedText translated_text)))
        ]
        [ Html.div
            [ style "font-weight" "bold" ]
            [ text translated_text.acronym ]
        , Html.div
            [ style "font-weight" "bold" ]
            [ text translated_text.title ]
        , Html.div
            [ style "font-style" "italic" ]
            [ text translated_text.author_uid ]
        , Html.div
            [ style "padding-left" "1em" ]
            [ text snippet ]
        ]


viewSelectedRootTextHeader : RootText -> Html m
viewSelectedRootTextHeader t =
    header
        []
        [ p [ class "suttaref" ] [ text t.acronym ]
        , h1 [] [ text t.title ]
        , h3 [] [ text ("translated by " ++ t.author_uid) ]
        ]


viewSelectedTranslatedTextHeader : TranslatedText -> Html m
viewSelectedTranslatedTextHeader t =
    header
        []
        [ p [ class "suttaref" ] [ text t.acronym ]
        , h1 [] [ text t.root_title ]
        , h2 [] [ text t.title ]
        , h3 [] [ text ("translated by " ++ t.author_uid) ]
        ]


viewSelectedTextHeader : (Msg m -> m) -> Model -> Html m
viewSelectedTextHeader lift model =
    case model.selectedText of
        Nothing ->
            div [] []

        Just t ->
            case t of
                SelectedTranslatedText t_ ->
                    viewSelectedTranslatedTextHeader t_

                SelectedRootText t_ ->
                    viewSelectedRootTextHeader t_


viewSelectedTextBody : (Msg m -> m) -> Model -> Html m
viewSelectedTextBody lift model =
    case model.selectedText of
        Nothing ->
            div [] [ text "No selected text." ]

        Just t ->
            case t of
                SelectedTranslatedText t_ ->
                    div [] <|
                        Markdown.toHtml mdRawHtml t_.content_html

                SelectedRootText t_ ->
                    div [] <|
                        Markdown.toHtml mdRawHtml t_.content_html


searchInput : (Msg m -> m) -> Model -> Html m
searchInput lift model =
    let
        searchIcon =
            ( Medium, [], icon Standard [] [ i [ class "mdi mdi-magnify", style "color" "black" ] [] ] )

        myControlInputModifiers : ControlInputModifiers m
        myControlInputModifiers =
            { controlInputModifiers | size = Medium, iconLeft = Just searchIcon }

        myControlAttrs : List (Attribute m)
        myControlAttrs =
            []

        myInputAttrs : List (Attribute m)
        myInputAttrs =
            [ placeholder "Search in texts, e.g.: middle way, majjhima patipada, DN 16 ..."
            , autofocus True
            , onInput (\x -> lift (SetTextLookupQuery x))
            ]
    in
    field []
        [ controlLabel [] []
        , controlText myControlInputModifiers
            myControlAttrs
            myInputAttrs
            []
        ]


myColumnsModifiers : ColumnsModifiers
myColumnsModifiers =
    { multiline = False
    , gap = Gap1
    , display = TabletAndBeyond
    , centered = True
    }


type alias Model =
    { lookupQuery : String
    , lookupResults : WebData TextQueryData
    , selectedText : Maybe SelectedText
    , selectedTextList : List SelectedText
    , isReadingExpanded : Bool
    }


initialModel =
    { lookupQuery = ""
    , lookupResults = RemoteData.NotAsked
    , selectedText = Just (SelectedTranslatedText initialTranslatedText)
    , selectedTextList = [ SelectedTranslatedText initialTranslatedText ]
    , isReadingExpanded = False
    }


initialTranslatedText : TranslatedText
initialTranslatedText =
    { id = 999888
    , uid = "sn56.11-initial/thanissaro"
    , author_uid = "thanissaro"
    , acronym = "SN 56.11"
    , volpage = "PTS"
    , title = "Setting the Wheel of Dhamma in Motion"
    , root_title = "Dhammacakkappavattana Sutta"
    , content_language = "en"
    , content_plain = "Lorem ipsum"
    , content_html = "<p>Lorem ipsum</p><p><em>Lorem ispum</em></p>"
    }


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
    , title : String
    , root_title : String
    , content_language : String
    , content_plain : String
    , content_html : String
    }


type alias TextQueryData =
    { root_texts : List RootText
    , translated_texts : List TranslatedText
    }


type SelectedText
    = SelectedRootText RootText
    | SelectedTranslatedText TranslatedText


type Msg m
    = NoOp
    | AddToSelectedTexts SelectedText
    | SetTextLookupQuery String
    | TextQueryDataReceived (WebData TextQueryData)
    | SetSelectedReadText SelectedText
    | ToggleExpandReading


update : (Msg m -> m) -> Msg m -> Model -> ( Model, Cmd m )
update lift msg model =
    case msg of
        NoOp ->
            ( model, Cmd.none )

        SetTextLookupQuery query ->
            ( { model | lookupQuery = query }, fetchTextQuery lift query )

        TextQueryDataReceived data ->
            ( { model | lookupResults = data }, Cmd.none )

        ToggleExpandReading ->
            ( { model | isReadingExpanded = not model.isReadingExpanded }, Cmd.none )

        AddToSelectedTexts selectedText ->
            let
                t_uid =
                    getUid selectedText

                m =
                    { model | selectedText = Just selectedText }

                m_ =
                    let
                        textList =
                            List.filter (\x -> not (getUid x == t_uid)) m.selectedTextList
                    in
                    { m | selectedTextList = selectedText :: textList }
            in
            ( m_, Cmd.none )

        SetSelectedReadText t ->
            ( { model | selectedText = Just t }, Cmd.none )


getUid t =
    case t of
        SelectedRootText t_ ->
            t_.uid

        SelectedTranslatedText t_ ->
            t_.uid


authorDecoder : Decoder Author
authorDecoder =
    Decode.succeed Author
        |> required "id" int
        |> required "uid" string
        |> required "blurb" string
        |> required "long_name" string
        |> required "short_name" string


rootTextDecoder : Decoder RootText
rootTextDecoder =
    Decode.succeed RootText
        |> required "id" int
        |> required "uid" string
        |> required "author_uid" string
        |> required "acronym" string
        |> required "volpage" string
        |> required "title" string
        |> required "content_language" string
        |> required "content_plain" string
        |> required "content_html" string


translatedTextDecoder : Decoder TranslatedText
translatedTextDecoder =
    Decode.succeed TranslatedText
        |> required "id" int
        |> required "uid" string
        |> required "author_uid" string
        |> required "acronym" string
        |> required "volpage" string
        |> required "title" string
        |> required "root_title" string
        |> required "content_language" string
        |> required "content_plain" string
        |> required "content_html" string


textQueryDataDecoder : Decoder TextQueryData
textQueryDataDecoder =
    Decode.succeed TextQueryData
        |> required "root_texts" (list rootTextDecoder)
        |> required "translated_texts" (list translatedTextDecoder)


fetchTextQuery : (Msg m -> m) -> String -> Cmd m
fetchTextQuery lift query =
    textQueryDataDecoder
        |> Http.get (UB.absolute [ "search", "texts" ] [ UB.string "query" query ])
        |> RemoteData.sendRequest
        |> Cmd.map (\x -> lift (TextQueryDataReceived x))


mdRawHtml =
    Just (MDConf.Options False MDConf.ParseUnsafe)
